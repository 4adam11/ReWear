import mongoose from "mongoose";

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
  availability: {
    startDate: Date,
    endDate: Date
  },
  // Each listing is a single second-hand item: once bought it's "sold" and leaves Explore
  status: { type: String, enum: ["available", "sold"], default: "available" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

// Explore: newest available listings, optionally filtered by mode/category
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, mode: 1, category: 1 });
// Dashboard: a seller's own listings
productSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Product", productSchema);
