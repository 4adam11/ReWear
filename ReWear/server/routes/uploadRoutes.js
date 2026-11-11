import express from "express";
import Upload from "../models/Upload.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { moderateImage } from "../utils/imageModeration.js";
import { uploadImage } from "../utils/cloudinary.js";

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many uploads, please try again later"
});

const DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_BYTES = 5 * 1024 * 1024;

//
// UPLOAD ONE PHOTO (moderate first, then store on Cloudinary)
//
router.post("/", protect, uploadLimiter, async (req, res) => {
  const { image } = req.body;

  const match = typeof image === "string" && image.match(DATA_URL_RE);

  if (!match) {
    return res.status(400).json({ message: "Please upload a JPEG, PNG or WebP image" });
  }

  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ message: "Images must be under 5 MB" });
  }

  let verdict;

  try {
    verdict = await moderateImage(buffer);
  } catch (err) {
    // Fail closed: never store a photo that wasn't checked
    console.error("MODERATION ERROR:", err.message);
    return res.status(503).json({ message: "Photo checking is unavailable, please try again shortly" });
  }

  // The AI only blocks clearly explicit images by itself, so admins never have to see them.
  // Anything else it's unsure about (e.g. "doesn't look like clothing") is uploaded with a flag,
  // and an admin makes the final decision when reviewing the listing.
  if (!verdict.ok && verdict.reason === "explicit") {
    console.warn("UPLOAD BLOCKED:", req.user._id.toString(), verdict.reason, verdict.scores);
    return res.status(422).json({ message: verdict.message, reason: verdict.reason });
  }

  const { url, publicId } = await uploadImage(image);

  // Written for the admin: what the AI actually saw
  const aiNote = verdict.ok
    ? null
    : `May not show clothing. Closest match: "${verdict.scores.topLabel}" (clothing confidence ${Math.round(verdict.scores.clothing * 100)}%).`;

  await Upload.create({
    user: req.user._id,
    url,
    publicId,
    scores: verdict.scores,
    aiNote,
  });

  // "style" helps the sell form pre-pick an occasion; the seller can always change it
  res.status(201).json({ url, aiFlagged: !!aiNote, aiNote, suggestion: verdict.style ? { style: verdict.style } : null });
});

export default router;
