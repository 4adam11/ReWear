import express from "express";
import mongoose from "mongoose";
import Product, { LIVE } from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import protect, { requireAdmin } from "../middleware/authMiddleware.js";
import { notify } from "../utils/notify.js";

const router = express.Router();

// Every route here is admin-only
router.use(protect, requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readReason = (body) =>
  typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

//
// DASHBOARD NUMBERS
//
router.get("/stats", async (req, res) => {
  const [byStatus, flagged, users, blocked, orders, revenue] = await Promise.all([
    Product.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Product.countDocuments({ status: "pending", "review.aiFlagged": true }),
    User.countDocuments(),
    User.countDocuments({ blocked: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const listings = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));

  res.json({
    listings: {
      pending: listings.pending || 0,
      live: (listings.live || 0) + (listings.available || 0),
      rejected: listings.rejected || 0,
      paused: listings.paused || 0,
      sold: listings.sold || 0,
    },
    flagged,
    users,
    blocked,
    orders,
    revenue: revenue[0]?.total || 0,
  });
});

//
// LISTINGS: review queue (oldest first) and everything else
// GET /api/admin/listings?status=pending|live|rejected|paused|sold|all&flagged=1&search=&page=1
//
router.get("/listings", async (req, res) => {
  const status = req.query.status || "pending";
  const filter = {};

  if (status === "live") filter.status = { $in: LIVE };
  else if (status !== "all") filter.status = status;

  if (req.query.flagged === "1") filter["review.aiFlagged"] = true;

  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const limit = 20;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const sort = status === "pending" ? { "review.submittedAt": 1, createdAt: 1 } : { updatedAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email blocked")
      .populate("review.reviewedBy", "name")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

const findListing = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: "Listing not found" });
    return null;
  }

  const product = await Product.findById(req.params.id);
  if (!product) res.status(404).json({ message: "Listing not found" });
  return product;
};

router.patch("/listings/:id/approve", async (req, res) => {
  const product = await findListing(req, res);
  if (!product) return;

  if (!["pending", "rejected"].includes(product.status)) {
    return res.status(400).json({ message: "Only listings in review (or rejected) can be approved" });
  }

  product.status = "live";
  product.review.everApproved = true;
  product.review.rejectReason = undefined;
  product.review.reviewedBy = req.user._id;
  product.review.reviewedAt = new Date();
  await product.save();

  notify(product.user, {
    type: "listing_approved",
    title: "Your listing is live",
    message: `"${product.title}" was approved and is now visible to buyers.`,
    link: `/product/${product._id}`,
  });

  res.json(product);
});

router.patch("/listings/:id/reject", async (req, res) => {
  const product = await findListing(req, res);
  if (!product) return;

  const reason = readReason(req.body);
  if (reason.length < 5) {
    return res.status(400).json({ message: "Please give the seller a reason (at least 5 characters)" });
  }

  if (product.status === "sold") {
    return res.status(400).json({ message: "Sold listings can't be rejected" });
  }

  // Also used to take down a live listing that breaks the rules
  const wasLive = LIVE.includes(product.status) || product.status === "paused";

  product.status = "rejected";
  product.review.rejectReason = reason;
  product.review.reviewedBy = req.user._id;
  product.review.reviewedAt = new Date();
  await product.save();

  notify(product.user, {
    type: "listing_rejected",
    title: wasLive ? "Your listing was taken down" : "Your listing needs changes",
    message: `"${product.title}": ${reason}`,
    link: `/sell/${product._id}`,
  });

  res.json(product);
});

//
// USERS
//
router.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  const filter = search
    ? { $or: [{ name: { $regex: escapeRegex(search), $options: "i" } }, { email: { $regex: escapeRegex(search), $options: "i" } }] }
    : {};

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).limit(100).lean();
  const ids = users.map((u) => u._id);

  const [listingCounts, orderCounts] = await Promise.all([
    Product.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
  ]);

  const count = (rows) => Object.fromEntries(rows.map((r) => [r._id.toString(), r.n]));
  const listings = count(listingCounts);
  const orders = count(orderCounts);

  res.json(
    users.map((u) => ({
      ...u,
      listings: listings[u._id.toString()] || 0,
      orders: orders[u._id.toString()] || 0,
    }))
  );
});

router.patch("/users/:id/block", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role === "admin") {
    return res.status(400).json({ message: "Admins can't be blocked" });
  }

  const blocked = req.body.blocked !== false;
  user.blocked = blocked;
  await user.save();

  // A blocked seller's live listings come down with them
  if (blocked) {
    await Product.updateMany({ user: user._id, status: { $in: LIVE } }, { $set: { status: "paused" } });
  }

  res.json({ _id: user._id, blocked: user.blocked });
});

//
// ORDERS (overview)
//
router.get("/orders", async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "name email")
    .populate("items.seller", "name")
    .lean();

  res.json(orders);
});

export default router;
