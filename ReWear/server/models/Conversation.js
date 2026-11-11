import mongoose from "mongoose";

// One chat per buyer per listing, between that buyer and the listing's seller
const conversationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Kept on the chat so it still makes sense if the listing is later removed
  productTitle: String,
  productImage: String,
  lastMessage: { type: String, maxlength: 200 },
  lastSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lastAt: { type: Date, default: Date.now },
  // Messages each side hasn't opened yet
  unreadBuyer: { type: Number, default: 0 },
  unreadSeller: { type: Number, default: 0 },
}, { timestamps: true });

conversationSchema.index({ product: 1, buyer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastAt: -1 });
conversationSchema.index({ seller: 1, lastAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
