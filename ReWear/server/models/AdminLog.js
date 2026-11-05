import mongoose from "mongoose";

// Audit trail: every admin decision, who made it and when
const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ["listing", "user", "order", "dispute"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  summary: { type: String, maxlength: 500 },
}, { timestamps: true });

adminLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminLog", adminLogSchema);
