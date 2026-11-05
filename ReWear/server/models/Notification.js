import mongoose from "mongoose";

// In-app notifications (the bell in the navbar)
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, maxlength: 140 },
  message: { type: String, maxlength: 500 },
  // Page to open when clicked, e.g. "/seller/listings"
  link: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
