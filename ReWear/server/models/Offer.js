import mongoose from "mongoose";

// "Make an offer" on an item for sale: buyer offers, seller accepts, rejects or counters.
// An accepted offer lets that buyer check out at the agreed price for 48 hours.
export const OFFER_HOURS = 48;

const offerSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  image: String,
  listPrice: Number,
  amount: { type: Number, required: true, min: 1 },
  // pending -> accepted | rejected | countered (seller) ; countered -> accepted | rejected (buyer)
  // accepted -> used (ordered) or expired ; withdrawn by the buyer while pending
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "countered", "withdrawn", "used", "expired"],
    default: "pending",
  },
  counterAmount: Number,
  message: { type: String, maxlength: 300 },
  expiresAt: Date,
}, { timestamps: true });

offerSchema.index({ buyer: 1, createdAt: -1 });
offerSchema.index({ seller: 1, status: 1, createdAt: -1 });
offerSchema.index({ product: 1, buyer: 1, status: 1 });

export default mongoose.model("Offer", offerSchema);
