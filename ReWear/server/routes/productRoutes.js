import express from "express";
import Product from "../models/Product.js";
import Upload from "../models/Upload.js";
import protect from "../middleware/authMiddleware.js";
import { validateProduct } from "../utils/validateProduct.js";

const router = express.Router();

const isOwner = (product, user) =>
  product.user?.toString() === user._id.toString();

// GET ALL
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// CREATE
router.post("/", protect, async (req, res) => {
  const { error, data } = validateProduct(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  // Every photo must have passed moderation and belong to this seller
  const uniqueImages = [...new Set(data.images)];
  const approved = await Upload.countDocuments({
    user: req.user._id,
    url: { $in: uniqueImages },
  });

  if (approved !== uniqueImages.length) {
    return res.status(400).json({ message: "Please upload photos using the photo uploader" });
  }

  data.images = uniqueImages;

  const product = await Product.create({
    ...data,
    user: req.user._id
  });

  res.status(201).json(product);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
});

router.delete("/:id", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!isOwner(product, req.user)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await product.deleteOne();

  res.json({ message: "Product removed" });
});

router.put("/:id", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Not found" });
  }

  if (!isOwner(product, req.user)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { title } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ message: "Title must be 1-120 characters" });
    }
    product.title = title.trim();
  }

  const updated = await product.save();

  res.json(updated);
});

export default router;
