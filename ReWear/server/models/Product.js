import mongoose from "mongoose";

// Listing lifecycle:
//   pending  -> waiting for an admin (AI has pre-checked the photos)
//   live     -> approved and visible in Explore
//   rejected -> admin said no (reason in review.rejectReason); seller can edit and resubmit
//   paused   -> seller hid it temporarily
//   sold     -> bought; kept for order history
// ("available" is the old name for "live" and is migrated on startup.)
export const LIVE = ["live", "available"];

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000 },
  images: [String],
  price: { type: Number, min: 0 },
  rent: { type: Number, min: 0 },
  // "sale" kept so older listings still pass validation on save
  mode: { type: String, enum: ["sell", "sale", "rent", "both"], required: true },
  category: { type: String, trim: true, maxlength: 50 },
  size: { type: String, trim: true, maxlength: 10 },
  condition: { type: String, trim: true, maxlength: 30 },
  fabric: { type: String, trim: true, maxlength: 60 },
  // The garment's own measurements in inches (all optional)
  measurements: {
    bust: Number,
    waist: Number,
    hips: Number,
    length: Number,
    shoulder: Number,
  },
  availability: {
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ["pending", "live", "rejected", "paused", "sold", "available"],
    default: "pending"
  },
  review: {
    // What the AI photo check noticed, shown to the admin; it never decides on its own
    aiFlagged: { type: Boolean, default: false },
    aiNotes: [String],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectReason: { type: String, maxlength: 500 },
    // Once an admin has approved it, price-only edits don't need another review
    everApproved: { type: Boolean, default: false },
    submittedAt: Date
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

// Explore: newest live listings, optionally filtered by mode/category
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, mode: 1, category: 1 });
// Dashboard: a seller's own listings
productSchema.index({ user: 1, createdAt: -1 });
// Admin review queue
productSchema.index({ status: 1, "review.submittedAt": 1 });

export default mongoose.model("Product", productSchema);
