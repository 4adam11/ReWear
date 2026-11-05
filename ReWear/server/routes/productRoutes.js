import express from "express";
import Product, { LIVE } from "../models/Product.js";
import Upload from "../models/Upload.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import protect, { optionalAuth } from "../middleware/authMiddleware.js";
import { validateProduct } from "../utils/validateProduct.js";
import { CATEGORIES, SIZES, normalizeCategory } from "../utils/catalog.js";
import { upcomingRentals } from "../utils/bookings.js";
import { deleteImage } from "../utils/cloudinary.js";
import { notifyAdmins } from "../utils/notify.js";

const router = express.Router();

const isOwner = (product, user) =>
  !!user && product.user?.toString() === user._id.toString();

const isAdmin = (user) => user?.role === "admin";

// Only what product cards need; just the first photo
const CARD_FIELDS = "title price rent mode category size condition status user createdAt";

const listQuery = (query, extra = "") =>
  query.select(`${CARD_FIELDS} ${extra}`).slice("images", 1).lean();

const listParam = (value, allowed) =>
  typeof value === "string"
    ? value.split(",").map((v) => v.trim()).filter((v) => allowed.includes(v))
    : [];

// Adds each listing's seller name (kept separate from "user" so owner checks still compare ids)
const withSellerNames = async (items) => {
  const ids = [...new Set(items.map((p) => p.user?.toString()).filter(Boolean))];
  const users = await User.find({ _id: { $in: ids } }).select("name rating").lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return items.map((p) => {
    const u = byId.get(p.user?.toString());
    return { ...p, sellerName: u?.name || "ReWear seller", sellerRating: u?.rating?.count ? u.rating : null };
  });
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toDay = (d) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);

// Every photo must have gone through /api/uploads (AI check) and belong to this seller.
// Returns { error } or { images, aiNotes }.
const checkImages = async (userId, images) => {
  const unique = [...new Set(images)];
  const uploads = await Upload.find({ user: userId, url: { $in: unique } }).lean();

  if (uploads.length !== unique.length) {
    return { error: "Please upload photos using the photo uploader" };
  }

  const aiNotes = [...new Set(uploads.map((u) => u.aiNote).filter(Boolean))];
  return { images: unique, aiNotes };
};

const submitForReview = (product, aiNotes) => {
  product.status = "pending";
  product.review.aiFlagged = aiNotes.length > 0;
  product.review.aiNotes = aiNotes;
  product.review.rejectReason = undefined;
  product.review.submittedAt = new Date();
};

const notifyNewSubmission = (product) =>
  notifyAdmins({
    type: "listing_submitted",
    title: product.review.aiFlagged ? "Flagged listing needs review" : "New listing to review",
    message: product.review.aiFlagged
      ? `"${product.title}": ${product.review.aiNotes.join(" ")}`
      : `"${product.title}" is waiting for approval.`,
    link: "/admin/listings",
  });

//
// BROWSE: only approved (live) listings; filtering, sorting and paging happen in the database
// GET /api/products?mode=sale|rent&search=&categories=party,wedding&sizes=M,L&maxPrice=5000&sort=new|low|high&page=1&limit=9
//
router.get("/", async (req, res) => {
  // "all" = both kinds (home page "Fresh on ReWear")
  const mode = ["rent", "all"].includes(req.query.mode) ? req.query.mode : "sale";
  const priceField = mode === "rent" ? "rent" : "price";

  const filter = {
    status: { $in: LIVE },
  };

  if (mode !== "all") {
    filter.mode = { $in: mode === "rent" ? ["rent", "both"] : ["sell", "sale", "both"] };
  }

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

  // One seller's shop ("See all items from this seller")
  if (typeof req.query.seller === "string" && mongoose.isValidObjectId(req.query.seller)) {
    filter.user = req.query.seller;
  }

  const maxPrice = Number(req.query.maxPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    if (mode === "all") {
      // Either price can match (rent-only listings have no sale price)
      filter.$or = [{ price: { $lte: maxPrice } }, { rent: { $lte: maxPrice } }];
    } else {
      filter[priceField] = { $lte: maxPrice };
    }
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
    items: await withSellerNames(items),
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

//
// HOME PAGE in one request: newest items, rentals and a cover photo per category
//
router.get("/home", async (req, res) => {
  const live = { status: { $in: LIVE } };

  const [fresh, rentals, covers] = await Promise.all([
    listQuery(Product.find(live).sort({ createdAt: -1 }).limit(10)),
    listQuery(Product.find({ ...live, mode: { $in: ["rent", "both"] } }).sort({ createdAt: -1 }).limit(5)),
    Product.aggregate([
      { $match: { ...live, category: { $in: CATEGORIES } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$category", image: { $first: { $arrayElemAt: ["$images", 0] } } } },
    ]),
  ]);

  // Rarely changes; let browsers reuse it for a minute
  res.set("Cache-Control", "public, max-age=60");
  res.json({
    fresh: await withSellerNames(fresh),
    rentals: await withSellerNames(rentals),
    covers: Object.fromEntries(covers.map((c) => [c._id, c.image])),
  });
});

//
// MY LISTINGS (seller), every status, with review feedback
//
router.get("/mine", protect, async (req, res) => {
  const products = await listQuery(
    Product.find({ user: req.user._id }).sort({ createdAt: -1 }),
    "review.rejectReason review.aiFlagged review.everApproved review.submittedAt updatedAt"
  );

  res.json(products);
});

//
// CREATE: goes to the admin review queue, not straight to Explore
//
router.post("/", protect, async (req, res) => {
  const { error, data } = validateProduct(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const checked = await checkImages(req.user._id, data.images);
  if (checked.error) {
    return res.status(400).json({ message: checked.error });
  }

  const product = new Product({
    ...data,
    images: checked.images,
    user: req.user._id,
    review: {},
  });

  submitForReview(product, checked.aiNotes);
  await product.save();
  notifyNewSubmission(product);

  res.status(201).json(product);
});

//
// ONE PRODUCT, plus the days it's already booked so the date picker can block them.
// Listings that aren't approved yet are only visible to their seller and admins.
//
router.get("/:id", optionalAuth, async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const publicStatus = [...LIVE, "sold"].includes(product.status);
  if (!publicStatus && !isOwner(product, req.user) && !isAdmin(req.user)) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Review details are only for the seller and admins
  if (!isOwner(product, req.user) && !isAdmin(req.user)) {
    delete product.review;
  }

  const bookings = (await upcomingRentals(product._id)).map((b) => ({
    start: toDay(b.start),
    end: toDay(b.end),
  }));

  const seller = await User.findById(product.user).select("name createdAt rating").lean();

  res.json({
    ...product,
    bookings,
    seller: seller ? { _id: seller._id, name: seller.name, since: seller.createdAt, rating: seller.rating } : null,
  });
});

//
// EDIT (seller). Price/rent/size/condition/availability changes on an approved listing
// apply immediately; new photos, title, description or category go back for review.
//
router.put("/:id", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Not found" });
  }

  if (!isOwner(product, req.user)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (product.status === "sold") {
    return res.status(400).json({ message: "Sold listings can't be edited" });
  }

  const { error, data } = validateProduct(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const checked = await checkImages(req.user._id, data.images);
  if (checked.error) {
    return res.status(400).json({ message: checked.error });
  }

  const sameImages =
    checked.images.length === product.images.length &&
    checked.images.every((url, i) => url === product.images[i]);

  const contentChanged =
    !sameImages ||
    data.title !== product.title ||
    (data.description || "") !== (product.description || "") ||
    data.category !== product.category;

  Object.assign(product, { ...data, images: checked.images });

  const needsReview =
    contentChanged || !product.review?.everApproved || ["pending", "rejected"].includes(product.status);

  if (needsReview) {
    submitForReview(product, checked.aiNotes);
  }

  await product.save();

  if (needsReview) {
    notifyNewSubmission(product);
  }

  res.json({
    product,
    message: needsReview
      ? "Changes saved and sent for review. Your listing will be visible again once an admin approves it."
      : "Changes saved. They're live now.",
  });
});

//
// PAUSE / RELIST (seller)
//
router.patch("/:id/pause", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ message: "Not found" });
  if (!isOwner(product, req.user)) return res.status(403).json({ message: "Not authorized" });

  if (!LIVE.includes(product.status)) {
    return res.status(400).json({ message: "Only live listings can be paused" });
  }

  product.status = "paused";
  await product.save();
  res.json(product);
});

router.patch("/:id/resume", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ message: "Not found" });
  if (!isOwner(product, req.user)) return res.status(403).json({ message: "Not authorized" });

  if (product.status !== "paused") {
    return res.status(400).json({ message: "Only paused listings can be relisted" });
  }

  product.status = "live";
  await product.save();
  res.json(product);
});

router.delete("/:id", protect, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!isOwner(product, req.user) && !isAdmin(req.user)) {
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
  const uploads = await Upload.find({ user: product.user, url: { $in: product.images } });
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

export default router;
