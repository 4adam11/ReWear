import mongoose from "mongoose";

// One row per visitor per listing per day, so refreshing a page doesn't inflate its view count.
// Rows delete themselves after two days; the running total lives on the product.
const productViewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  // A logged-in user's id, or a hash of the visitor's network address
  visitor: { type: String, required: true },
  day: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 48 },
});

productViewSchema.index({ product: 1, visitor: 1, day: 1 }, { unique: true });

export default mongoose.model("ProductView", productViewSchema);
