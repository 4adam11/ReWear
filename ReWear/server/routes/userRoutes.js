import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product, { LIVE } from "../models/Product.js";
import Review from "../models/Review.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import generateToken from "../utils/generateToken.js";

const router = express.Router();

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const MAX_ADDRESSES = 5;

const readAddress = (body) => {
  const a = {
    name: str(body?.name, 100),
    phone: str(body?.phone, 15).replace(/\s/g, ""),
    line: str(body?.line, 300),
    city: str(body?.city, 80),
    state: str(body?.state, 80),
    pincode: str(body?.pincode, 6),
  };

  if (!a.name) return { error: "Please enter a name" };
  if (!/^[6-9]\d{9}$/.test(a.phone)) return { error: "Please enter a 10-digit mobile number" };
  if (a.line.length < 8) return { error: "Please enter the house number, street and area" };
  if (!a.city || !a.state) return { error: "Please enter the city and state" };
  if (!/^\d{6}$/.test(a.pincode)) return { error: "Please enter a 6-digit pincode" };
  return { address: a };
};

const profileOf = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone || "",
  addresses: u.addresses || [],
  rating: u.rating,
  since: u.createdAt,
});

//
// MY ACCOUNT
//
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  res.json(profileOf(user));
});

router.patch("/me", protect, async (req, res) => {
  const name = str(req.body.name, 100);
  const phone = str(req.body.phone, 15).replace(/\s/g, "");

  if (!name) return res.status(400).json({ message: "Please enter your name" });
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "Please enter a 10-digit mobile number" });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { name, phone: phone || undefined }, { new: true }).lean();
  res.json(profileOf(user));
});

router.patch("/me/password", protect, rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  const current = typeof req.body.currentPassword === "string" ? req.body.currentPassword.slice(0, 200) : "";
  const next = typeof req.body.newPassword === "string" ? req.body.newPassword.trim().slice(0, 200) : "";

  if (next.length < 8 || next.length > 128) {
    return res.status(400).json({ message: "Your new password needs 8 to 128 characters" });
  }

  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(current.trim(), user.password))) {
    return res.status(400).json({ message: "Your current password is wrong" });
  }

  user.password = await bcrypt.hash(next, 10);
  user.passwordChangedAt = new Date();
  await user.save();

  // Other devices are signed out; this one gets a fresh token
  res.json({ message: "Password changed", token: generateToken(user._id) });
});

router.post("/me/addresses", protect, async (req, res) => {
  const { error, address } = readAddress(req.body);
  if (error) return res.status(400).json({ message: error });

  const user = await User.findById(req.user._id);
  if (user.addresses.length >= MAX_ADDRESSES) {
    return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses` });
  }

  user.addresses.push(address);
  await user.save();
  res.status(201).json(profileOf(user));
});

router.delete("/me/addresses/:addressId", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json(profileOf(user));
});

//
// PUBLIC SELLER PROFILE (shop page)
//
router.get("/:id/public", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const user = await User.findById(req.params.id).select("name createdAt rating blocked").lean();
  if (!user || user.blocked) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const [liveCount, soldCount, reviews] = await Promise.all([
    Product.countDocuments({ user: user._id, status: { $in: LIVE } }),
    Product.countDocuments({ user: user._id, status: "sold" }),
    Review.find({ seller: user._id }).sort({ createdAt: -1 }).limit(20).populate("buyer", "name").lean(),
  ]);

  res.json({
    _id: user._id,
    name: user.name,
    since: user.createdAt,
    rating: user.rating || { avg: 0, count: 0 },
    liveCount,
    soldCount,
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      title: r.title,
      // First name only, for privacy
      buyer: r.buyer?.name?.split(" ")[0] || "A buyer",
      createdAt: r.createdAt,
    })),
  });
});

export default router;
