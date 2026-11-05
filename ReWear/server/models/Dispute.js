import mongoose from "mongoose";

// "Report a problem" on an order, resolved by an admin
export const DISPUTE_REASONS = {
  not_received: "Item not received",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item sent",
  not_returned: "Rental not returned",
  other: "Something else",
};

const disputeSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  raisedBy: { type: String, enum: ["buyer", "seller"], required: true },
  reason: { type: String, enum: Object.keys(DISPUTE_REASONS), required: true },
  details: { type: String, required: true, maxlength: 1000 },
  status: { type: String, enum: ["open", "refunded", "rejected"], default: "open" },
  resolution: { type: String, maxlength: 1000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: Date,
}, { timestamps: true });

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ order: 1 });

export default mongoose.model("Dispute", disputeSchema);
