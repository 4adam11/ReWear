import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
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

app.use(cors({ origin: allowedOrigins }));
// Images are still sent as base64, so the body limit stays generous
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);

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
  .then(() => {
    console.log("Mongo Connected");
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
