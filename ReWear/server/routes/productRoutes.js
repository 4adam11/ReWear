import express from "express";
import Product from "../models/Product.js";
import Upload from "../models/Upload.js";
import protect from "../middleware/authMiddleware.js";
import { validateProduct } from "../utils/validateProduct.js";
import { CATEGORIES, SIZES, normalizeCategory } from "../utils/catalog.js";
import { upcomingRentals } from "../utils/bookings.js";
import { deleteImage } from "../utils/cloudinary.js";

const router = express.Router();

const isOwner = (product, user) =>
  product.user?.toString() === user._id.toString();

// Only what product cards need; just the first photo
const CARD_FIELDS = "title price rent mode category size condition status user createdAt";

const listQuery = (query) =>
  query.select(CARD_FIELDS).slice("images", 1).lean();

const listParam = (value, allowed) =>
  typeof value === "string"
    ? value.split(",").map((v) => v.trim()).filter((v) => allowed.includes(v))
    : [];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toDay = (d) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);

//
// BROWSE: filtering, sorting and paging happen in the database, not the browser
// GET /api/products?mode=sale|rent&search=&categories=party,wedding&sizes=M,L&maxPrice=5000&sort=new|low|high&page=1&limit=9
//
router.get("/", async (req, res) => {
  const mode = req.query.mode === "rent" ? "rent" : "sale";
  const priceField = mode === "rent" ? "rent" : "price";

  const filter = {
    status: { $ne: "sold" },
    mode: { $in: mode === "rent" ? ["rent", "both"] : ["sell", "sale", "both"] },
  };

  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: "i" };
  }

  const categories = listParam(
    typeof req.query.categories === "string"
      ? req.query.categories.split(",").map(normalizeCategory).join(",")
      : undefined,
    CATEGORIES
  );
  if (categories.length) {
    // Older listings may still say "street wear"
    filter.category = {
      $in: categories.includes("streetwear") ? [...categories, "street wear"] : categories,
    };
  }

  const sizes = listParam(req.query.sizes, SIZES);
  if (sizes.length) {
    filter.size = { $in: sizes };
  }

  const maxPrice = Number(req.query.maxPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    filter[priceField] = { $lte: maxPrice };
  }

  const sort =
    req.query.sort === "low" ? { [priceField]: 1, _id: 1 }
      : req.query.sort === "high" ? { [priceField]: -1, _id: 1 }
        : { createdAt: -1 };

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 24);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    listQuery(Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

//
// MY LISTINGS (dashboard), including sold ones
//
router.get("/mine", protect, async (req, res) => {
  const products = await listQuery(
    Product.find({ user: req.user._id }).sort({ createdAt: -1 })
  );

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

// ONE PRODUCT, plus the days it's already booked so the date picker can block them
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const bookings = (await upcomingRentals(product._id)).map((b) => ({
    start: toDay(b.start),
    end: toDay(b.end),
  }));

  res.json({ ...product, bookings });
});

router.delete("/:id", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!isOwner(product, req.user)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (product.status === "sold") {
    return res.status(400).json({ message: "Sold listings are kept for the buyer's order history" });
  }

  if ((await upcomingRentals(product._id)).length > 0) {
    return res.status(400).json({ message: "This listing has upcoming rentals and can't be deleted yet" });
  }

  await product.deleteOne();

  // Remove its photos from Cloudinary too (don't fail the delete if that errors)
  const uploads = await Upload.find({ user: req.user._id, url: { $in: product.images } });
  await Promise.all(
    uploads.map((u) =>
      deleteImage(u.publicId).catch((err) =>
        console.warn("Cloudinary delete failed:", u.publicId, err.message)
      )
    )
  );
  await Upload.deleteMany({ _id: { $in: uploads.map((u) => u._id) } });

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
