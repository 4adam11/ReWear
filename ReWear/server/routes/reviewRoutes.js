import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notify } from "../utils/notify.js";

const router = express.Router();

const reviewLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many reviews, please try again later" });

// Recalculate a seller's average from all their reviews
export const refreshSellerRating = async (sellerId) => {
  const [stats] = await Review.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(String(sellerId)) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await User.findByIdAndUpdate(sellerId, {
    rating: { avg: stats ? Math.round(stats.avg * 10) / 10 : 0, count: stats?.count || 0 },
  });
};

//
// RATE THE SELLER (buyer, once per completed order)
//
router.post("/", protect, reviewLimiter, async (req, res) => {
  const { orderId } = req.body;
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 1000) : "";

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Please choose 1 to 5 stars" });
  }

  const order = await Order.findById(orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.status !== "completed") {
    return res.status(400).json({ message: "You can review an order once it's completed" });
  }

  const seller = order.seller || order.items[0]?.seller;

  try {
    const review = await Review.create({
      order: order._id,
      buyer: req.user._id,
      seller,
      products: order.items.map((i) => i.product),
      title: order.items.map((i) => i.title).join(", "),
      rating,
      comment: comment || undefined,
    });

    await refreshSellerRating(seller);

    notify(seller, {
      type: "review_new",
      title: `New ${rating}-star review`,
      message: comment ? `"${comment.slice(0, 120)}"` : `For ${review.title}`,
      link: `/seller/${seller}`,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You've already reviewed this order" });
    }
    throw err;
  }
});

export default router;
