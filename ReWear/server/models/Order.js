import mongoose from "mongoose";

// Snapshot of the product at purchase time; prices come from the database, not the client
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  image: String,
  mode: { type: String, enum: ["sale", "rent"], required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rentStart: Date,
  rentEnd: Date,
  days: Number,
  lineTotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  subtotal: Number,
  discount: { type: Number, default: 0 },
  promoCode: String,
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["card", "upi", "cod"], required: true },
  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  status: { type: String, enum: ["placed", "cancelled"], default: "placed" }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
