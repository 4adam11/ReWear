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
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
