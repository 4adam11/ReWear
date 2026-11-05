import mongoose from "mongoose";

// Order lifecycle (one order per seller, like Amazon/Flipkart split shipments):
//   confirmed -> accepted (seller) -> shipped (seller adds courier + tracking)
//             -> delivered (buyer confirms receipt, or seller marks it)
//   sale:   delivered -> completed (buyer confirms all is well)
//   rental: delivered -> completed when the seller confirms the item came back
//   cancelled: by the buyer or seller before shipping (item goes back on sale)
// ("placed" is the old name for "confirmed" and is migrated on startup.)
export const ORDER_STATUSES = ["placed", "confirmed", "accepted", "shipped", "delivered", "completed", "cancelled", "refunded"];

// Orders that still hold their items (count for stock, rental bookings and earnings)
export const ACTIVE_ORDER = { $nin: ["cancelled", "refunded"] };

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
  lineTotal: { type: Number, required: true },
  // Set when bought at an accepted "make an offer" price
  offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  at: { type: Date, default: Date.now },
  by: { type: String, enum: ["buyer", "seller", "admin", "system"] },
  note: { type: String, maxlength: 500 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Orders from the same checkout (one per seller) share this id
  checkoutId: String,
  items: [orderItemSchema],
  subtotal: Number,
  discount: { type: Number, default: 0 },
  promoCode: String,
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["card", "upi", "cod"], required: true },
  payment: {
    // "simulated" until a payment gateway is connected; "cod" is collected on delivery
    status: { type: String, enum: ["simulated", "cod", "pending", "paid", "refunded"], default: "simulated" },
  },
  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  status: { type: String, enum: ORDER_STATUSES, default: "confirmed" },
  shipping: {
    courier: { type: String, maxlength: 60 },
    trackingNumber: { type: String, maxlength: 60 }
  },
  cancel: {
    by: { type: String, enum: ["buyer", "seller", "admin"] },
    reason: { type: String, maxlength: 500 }
  },
  timeline: [timelineSchema]
}, { timestamps: true });

// Buyer's order history, seller's sales, and rental clash checks
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ "items.seller": 1, createdAt: -1 });
orderSchema.index({ "items.product": 1, status: 1 });

export default mongoose.model("Order", orderSchema);
