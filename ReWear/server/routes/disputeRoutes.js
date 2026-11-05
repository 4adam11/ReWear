import express from "express";
import mongoose from "mongoose";
import Dispute, { DISPUTE_REASONS } from "../models/Dispute.js";
import Order from "../models/Order.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notify, notifyAdmins } from "../utils/notify.js";

const router = express.Router();

const reportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many reports, please try again later" });

const isRental = (order) => order.items.some((i) => i.mode === "rent");

//
// REPORT A PROBLEM
// Buyer: once the order has shipped (not received, damaged, not as described...)
// Seller: a rental that hasn't come back
//
router.post("/", protect, reportLimiter, async (req, res) => {
  const { orderId, reason } = req.body;
  const details = typeof req.body.details === "string" ? req.body.details.trim().slice(0, 1000) : "";

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order" });
  }
  if (!(reason in DISPUTE_REASONS)) {
    return res.status(400).json({ message: "Please choose what went wrong" });
  }
  if (details.length < 10) {
    return res.status(400).json({ message: "Please describe the problem (at least 10 characters)" });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const me = req.user._id.toString();
  const sellerId = (order.seller || order.items[0]?.seller)?.toString();
  const role = order.user.toString() === me ? "buyer" : sellerId === me ? "seller" : null;

  if (!role) return res.status(404).json({ message: "Order not found" });

  if (role === "buyer") {
    if (!["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({ message: "You can report a problem once the order has shipped" });
    }
    if (reason === "not_returned") {
      return res.status(400).json({ message: "Please choose what went wrong" });
    }
  } else {
    if (!isRental(order) || order.status !== "delivered" || reason !== "not_returned") {
      return res.status(400).json({ message: "Sellers can only report rentals that haven't been returned" });
    }
  }

  if (await Dispute.exists({ order: order._id, status: "open" })) {
    return res.status(409).json({ message: "There's already an open report for this order" });
  }

  const dispute = await Dispute.create({
    order: order._id,
    buyer: order.user,
    seller: sellerId,
    raisedBy: role,
    reason,
    details,
  });

  order.timeline.push({ status: "dispute_opened", by: role, note: DISPUTE_REASONS[reason] });
  await order.save();

  const titles = order.items.map((i) => i.title).join(", ");
  notify(role === "buyer" ? sellerId : order.user, {
    type: "dispute_opened",
    title: "A problem was reported on your order",
    message: `${titles}: ${DISPUTE_REASONS[reason]}. A ReWear admin will look into it.`,
    link: role === "buyer" ? "/seller/orders" : "/orders",
  });
  notifyAdmins({
    type: "dispute_opened",
    title: "New problem report",
    message: `${titles}: ${DISPUTE_REASONS[reason]}`,
    link: "/admin/disputes",
  });

  res.status(201).json(dispute);
});

// My reports (as buyer or seller)
router.get("/mine", protect, async (req, res) => {
  const disputes = await Dispute.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
    .sort({ createdAt: -1 })
    .lean();
  res.json(disputes);
});

export default router;
