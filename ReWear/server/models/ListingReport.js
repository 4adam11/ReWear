import mongoose from "mongoose";

// A shopper flagging a live listing for the admins to look at
export const REPORT_REASONS = {
  fake: "Looks fake or counterfeit",
  misdescribed: "Photos or details don't match",
  prohibited: "Not allowed on ReWear",
  offensive: "Offensive or inappropriate",
  wrong_category: "Listed in the wrong occasion",
  other: "Something else",
};

const listingReportSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, enum: Object.keys(REPORT_REASONS), required: true },
  details: { type: String, maxlength: 1000 },
  // open -> taken_down (listing removed) | dismissed (listing stays)
  status: { type: String, enum: ["open", "taken_down", "dismissed"], default: "open" },
  resolution: { type: String, maxlength: 500 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: Date,
}, { timestamps: true });

listingReportSchema.index({ status: 1, createdAt: 1 });
listingReportSchema.index({ product: 1, status: 1 });
// One open report per person per listing
listingReportSchema.index(
  { product: 1, reporter: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

export default mongoose.model("ListingReport", listingReportSchema);
