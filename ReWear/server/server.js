import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import { loadModels } from "./utils/imageModeration.js";

// Fail fast instead of running with a missing or guessable secret
for (const key of [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env (see .env.example)`);
    process.exit(1);
  }
}

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

// Security headers (no-sniff, frame protection, etc.); the API serves no HTML, so no CSP needed
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Gzip JSON responses (product lists shrink a lot)
app.use(compression());
app.use(cors({ origin: allowedOrigins }));
// Only photo uploads need big bodies; everything else is capped small to make abuse expensive
app.use("/api/uploads", express.json({ limit: "8mb" }));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("API Running"));

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Catches errors thrown in async routes (Express 5) without leaking stack traces
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ message: "Not found" });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: "Invalid data" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Upload too large" });
  }

  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Mongo Connected");

    // One-time migration: listings from before admin review count as already approved
    const migrated = await Product.updateMany(
      { status: "available" },
      { $set: { status: "live", "review.everApproved": true } }
    );
    if (migrated.modifiedCount) console.log(`Marked ${migrated.modifiedCount} older listings as live`);

    // Older orders join the order workflow as "confirmed", owned by their (first) seller
    const oldOrders = await Order.updateMany({ status: "placed" }, [
      {
        $set: {
          status: "confirmed",
          seller: { $ifNull: ["$seller", { $arrayElemAt: ["$items.seller", 0] }] },
          timeline: [{ status: "confirmed", at: "$createdAt", by: "system" }],
        },
      },
    ], { updatePipeline: true });
    if (oldOrders.modifiedCount) console.log(`Moved ${oldOrders.modifiedCount} older orders into the order workflow`);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Load the image models in the background so the first upload isn't slow.
    // The first run downloads them from Hugging Face, which can take a few minutes.
    console.log("Loading image moderation models...");
    loadModels()
      .then(() => console.log("Image moderation ready"))
      .catch((err) => console.error("Image moderation failed to load:", err.message));
  })
  .catch((err) => {
    console.error("Mongo connection failed:", err.message);
    process.exit(1);
  });
