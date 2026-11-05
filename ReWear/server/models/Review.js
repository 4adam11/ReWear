import mongoose from "mongoose";

// A buyer's rating of the seller for one completed order
const reviewSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  title: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ seller: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
