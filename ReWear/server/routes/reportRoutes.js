import express from "express";
import mongoose from "mongoose";
import ListingReport, { REPORT_REASONS } from "../models/ListingReport.js";
import Product, { LIVE } from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notifyAdmins } from "../utils/notify.js";

const router = express.Router();

const reportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many reports, please try again later" });

//
// REPORT A LISTING (any logged-in shopper, not the seller)
//
router.post("/", protect, reportLimiter, async (req, res) => {
  const { productId, reason } = req.body;
  const details = typeof req.body.details === "string" ? req.body.details.trim().slice(0, 1000) : "";

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid listing" });
  }
  if (!(reason in REPORT_REASONS)) {
    return res.status(400).json({ message: "Please choose what's wrong with the listing" });
  }
  if (reason === "other" && details.length < 10) {
    return res.status(400).json({ message: "Please describe the problem (at least 10 characters)" });
  }

  const product = await Product.findById(productId).select("title status user");
  if (!product || !LIVE.includes(product.status)) {
    return res.status(404).json({ message: "Listing not found" });
  }
  if (product.user.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't report your own listing" });
  }

  try {
    await ListingReport.create({
      product: product._id,
      reporter: req.user._id,
      seller: product.user,
      reason,
      details: details || undefined,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You've already reported this listing. An admin will look at it." });
    }
    throw err;
  }

  // One admin alert per listing, not per report
  const open = await ListingReport.countDocuments({ product: product._id, status: "open" });
  if (open === 1) {
    notifyAdmins({
      type: "listing_reported",
      title: "A listing was reported",
      message: `"${product.title}": ${REPORT_REASONS[reason]}`,
      link: "/admin/reports",
    });
  }

  res.status(201).json({ message: "Thanks. A ReWear admin will look at this listing." });
});

export default router;
