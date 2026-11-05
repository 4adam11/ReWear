import mongoose from "mongoose";

// Every image that passed moderation. Listings may only use URLs recorded here,
// so the check can't be skipped by posting images straight to /api/products.
const uploadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String, required: true, unique: true },
  publicId: { type: String, required: true },
  scores: {
    nsfw: Number,
    explicit: Number,
    clothing: Number,
    topLabel: String,
  },
  // Set when the AI is unsure about the photo; shown to the admin reviewing the listing
  aiNote: String,
}, { timestamps: true });

export default mongoose.model("Upload", uploadSchema);
