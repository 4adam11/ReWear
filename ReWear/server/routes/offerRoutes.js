import express from "express";
import mongoose from "mongoose";
import Offer, { OFFER_HOURS } from "../models/Offer.js";
import Product, { LIVE } from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notify } from "../utils/notify.js";

const router = express.Router();

const offerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many offers, please try again later" });

const ACTIVE = ["pending", "countered", "accepted"];
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Accepted offers that weren't used in time
const expireOld = () =>
  Offer.updateMany({ status: "accepted", expiresAt: { $lt: new Date() } }, { $set: { status: "expired" } });

// The lowest offer a seller will even see: half the asking price
const minOffer = (price) => Math.ceil(price * 0.5);

// The buyer's usable accepted offer for a product (or null)
export const findUsableOffer = async (offerId, buyerId, productId) => {
  if (!mongoose.isValidObjectId(offerId)) return null;
  return Offer.findOne({
    _id: offerId,
    buyer: buyerId,
    product: productId,
    status: "accepted",
    expiresAt: { $gt: new Date() },
  });
};

//
// MAKE AN OFFER (buyer)
//
router.post("/", protect, offerLimiter, async (req, res) => {
  const { productId } = req.body;
  const amount = Math.round(Number(req.body.amount));
  const message = typeof req.body.message === "string" ? req.body.message.trim().slice(0, 300) : "";

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid item" });
  }

  const product = await Product.findById(productId);
  if (!product || !LIVE.includes(product.status)) {
    return res.status(400).json({ message: "This item isn't available" });
  }
  if (!["sell", "sale", "both"].includes(product.mode) || !(product.price > 0)) {
    return res.status(400).json({ message: "Offers can only be made on items for sale" });
  }
  if (product.user.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't make an offer on your own item" });
  }
  if (!Number.isFinite(amount) || amount >= product.price) {
    return res.status(400).json({ message: `Your offer must be below the price of ${money(product.price)}` });
  }
  if (amount < minOffer(product.price)) {
    return res.status(400).json({ message: `The lowest offer for this item is ${money(minOffer(product.price))}` });
  }

  await expireOld();
  if (await Offer.exists({ product: product._id, buyer: req.user._id, status: { $in: ACTIVE } })) {
    return res.status(409).json({ message: "You already have an open offer on this item" });
  }

  const offer = await Offer.create({
    product: product._id,
    buyer: req.user._id,
    seller: product.user,
    title: product.title,
    image: product.images?.[0],
    listPrice: product.price,
    amount,
    message: message || undefined,
  });

  notify(product.user, {
    type: "offer_new",
    title: `New offer: ${money(amount)}`,
    message: `For "${product.title}" (listed at ${money(product.price)}).`,
    link: "/offers?tab=received",
  });

  res.status(201).json(offer);
});

// Offers I've made / received
router.get("/mine", protect, async (req, res) => {
  await expireOld();
  const offers = await Offer.find({ buyer: req.user._id }).sort({ updatedAt: -1 }).populate("seller", "name").lean();
  res.json(offers);
});

router.get("/received", protect, async (req, res) => {
  await expireOld();
  const offers = await Offer.find({ seller: req.user._id }).sort({ updatedAt: -1 }).populate("buyer", "name").lean();
  res.json(offers);
});

// My usable accepted offer on one product (shown on the product page)
router.get("/for/:productId", protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) return res.json(null);
  await expireOld();
  const offer = await Offer.findOne({
    product: req.params.productId,
    buyer: req.user._id,
    status: { $in: ACTIVE },
  }).lean();
  res.json(offer);
});

//
// RESPOND
// seller: accept | reject | counter (pending offers)
// buyer:  accept | reject (a counter-offer), withdraw (own pending offer)
//
router.patch("/:id/:action", protect, async (req, res) => {
  const { action } = req.params;
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Offer not found" });

  await expireOld();
  const offer = await Offer.findById(req.params.id);
  if (!offer) return res.status(404).json({ message: "Offer not found" });

  const me = req.user._id.toString();
  const role = offer.seller.toString() === me ? "seller" : offer.buyer.toString() === me ? "buyer" : null;
  if (!role) return res.status(404).json({ message: "Offer not found" });

  const allowed =
    role === "seller"
      ? offer.status === "pending" && ["accept", "reject", "counter"].includes(action)
      : (offer.status === "countered" && ["accept", "reject"].includes(action)) ||
        (offer.status === "pending" && action === "withdraw");

  if (!allowed) {
    return res.status(400).json({ message: `This offer is ${offer.status}` });
  }

  // The item may have sold meanwhile
  if (["accept", "counter"].includes(action)) {
    const product = await Product.findById(offer.product).select("status price");
    if (!product || !LIVE.includes(product.status)) {
      offer.status = "expired";
      await offer.save();
      return res.status(400).json({ message: "This item is no longer available" });
    }
  }

  const other = role === "seller" ? offer.buyer : offer.seller;
  const otherLink = role === "seller" ? "/offers" : "/offers?tab=received";

  if (action === "counter") {
    const counter = Math.round(Number(req.body.amount));
    if (!Number.isFinite(counter) || counter <= offer.amount || counter >= offer.listPrice) {
      return res.status(400).json({
        message: `Your counter-offer must be between ${money(offer.amount + 1)} and ${money(offer.listPrice - 1)}`,
      });
    }
    offer.status = "countered";
    offer.counterAmount = counter;
    notify(other, {
      type: "offer_countered",
      title: `Counter-offer: ${money(counter)}`,
      message: `The seller of "${offer.title}" countered your ${money(offer.amount)} offer.`,
      link: otherLink,
    });
  } else if (action === "accept") {
    if (offer.status === "countered") offer.amount = offer.counterAmount;
    offer.status = "accepted";
    offer.expiresAt = new Date(Date.now() + OFFER_HOURS * 60 * 60 * 1000);
    notify(other, {
      type: "offer_accepted",
      title: `Offer accepted: ${money(offer.amount)}`,
      message: role === "seller"
        ? `You can buy "${offer.title}" at this price for the next ${OFFER_HOURS} hours.`
        : `The buyer accepted your counter-offer for "${offer.title}".`,
      link: role === "seller" ? `/product/${offer.product}` : otherLink,
    });
  } else {
    offer.status = action === "withdraw" ? "withdrawn" : "rejected";
    if (action === "reject") {
      notify(other, {
        type: "offer_rejected",
        title: "Offer declined",
        message: `Your offer on "${offer.title}" was declined.`,
        link: otherLink,
      });
    }
  }

  await offer.save();
  res.json(offer);
});

export default router;
