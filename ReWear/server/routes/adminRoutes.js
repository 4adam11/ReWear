import express from "express";
import mongoose from "mongoose";
import Product, { LIVE } from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import protect, { requireAdmin } from "../middleware/authMiddleware.js";
import Dispute, { DISPUTE_REASONS } from "../models/Dispute.js";
import AdminLog from "../models/AdminLog.js";
import { notify } from "../utils/notify.js";
import { logAdmin } from "../utils/adminLog.js";

const router = express.Router();

// Every route here is admin-only
router.use(protect, requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readReason = (body) =>
  typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

//
// DASHBOARD NUMBERS
//
router.get("/stats", async (req, res) => {
  const [byStatus, flagged, users, blocked, orders, revenue, openDisputes] = await Promise.all([
    Product.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Product.countDocuments({ status: "pending", "review.aiFlagged": true }),
    User.countDocuments(),
    User.countDocuments({ blocked: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $nin: ["cancelled", "refunded"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Dispute.countDocuments({ status: "open" }),
  ]);

  const listings = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));

  res.json({
    listings: {
      pending: listings.pending || 0,
      live: (listings.live || 0) + (listings.available || 0),
      rejected: listings.rejected || 0,
      paused: listings.paused || 0,
      sold: listings.sold || 0,
    },
    flagged,
    users,
    blocked,
    orders,
    revenue: revenue[0]?.total || 0,
    openDisputes,
  });
});

//
// CHARTS: last 30 days, one point per day
//
router.get("/charts", async (req, res) => {
  const days = 30;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const perDay = (Model, match, sumField) =>
    Model.aggregate([
      { $match: { ...match, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          n: { $sum: 1 },
          ...(sumField && { total: { $sum: sumField } }),
        },
      },
    ]);

  const [orders, listings, users, decisions] = await Promise.all([
    perDay(Order, { status: { $nin: ["cancelled", "refunded"] } }, "$total"),
    perDay(Product, {}),
    perDay(User, {}),
    AdminLog.aggregate([
      { $match: { action: { $in: ["approve_listing", "reject_listing"] } } },
      { $group: { _id: "$action", n: { $sum: 1 } } },
    ]),
  ]);

  const byDay = (rows, key = "n") => Object.fromEntries(rows.map((r) => [r._id, r[key]]));
  const o = byDay(orders);
  const rev = byDay(orders, "total");
  const l = byDay(listings);
  const u = byDay(users);

  const series = [...Array(days)].map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { day: key, orders: o[key] || 0, revenue: rev[key] || 0, listings: l[key] || 0, users: u[key] || 0 };
  });

  const dec = Object.fromEntries(decisions.map((d) => [d._id, d.n]));
  res.json({ series, approved: dec.approve_listing || 0, rejected: dec.reject_listing || 0 });
});

//
// ACTIVITY LOG (newest first)
//
router.get("/activity", async (req, res) => {
  const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100).populate("admin", "name").lean();
  res.json(logs);
});

//
// LISTINGS: review queue (oldest first) and everything else
// GET /api/admin/listings?status=pending|live|rejected|paused|sold|all&flagged=1&search=&page=1
//
router.get("/listings", async (req, res) => {
  const status = req.query.status || "pending";
  const filter = {};

  if (status === "live") filter.status = { $in: LIVE };
  else if (status !== "all") filter.status = status;

  if (req.query.flagged === "1") filter["review.aiFlagged"] = true;

  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const limit = 20;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const sort = status === "pending" ? { "review.submittedAt": 1, createdAt: 1 } : { updatedAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email blocked")
      .populate("review.reviewedBy", "name")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

const findListing = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: "Listing not found" });
    return null;
  }

  const product = await Product.findById(req.params.id);
  if (!product) res.status(404).json({ message: "Listing not found" });
  return product;
};

router.patch("/listings/:id/approve", async (req, res) => {
  const product = await findListing(req, res);
  if (!product) return;

  if (!["pending", "rejected"].includes(product.status)) {
    return res.status(400).json({ message: "Only listings in review (or rejected) can be approved" });
  }

  product.status = "live";
  product.review.everApproved = true;
  product.review.rejectReason = undefined;
  product.review.reviewedBy = req.user._id;
  product.review.reviewedAt = new Date();
  await product.save();
  logAdmin(req.user, "approve_listing", "listing", product._id, `Approved "${product.title}"`);

  notify(product.user, {
    type: "listing_approved",
    title: "Your listing is live",
    message: `"${product.title}" was approved and is now visible to buyers.`,
    link: `/product/${product._id}`,
  });

  res.json(product);
});

router.patch("/listings/:id/reject", async (req, res) => {
  const product = await findListing(req, res);
  if (!product) return;

  const reason = readReason(req.body);
  if (reason.length < 5) {
    return res.status(400).json({ message: "Please give the seller a reason (at least 5 characters)" });
  }

  if (product.status === "sold") {
    return res.status(400).json({ message: "Sold listings can't be rejected" });
  }

  // Also used to take down a live listing that breaks the rules
  const wasLive = LIVE.includes(product.status) || product.status === "paused";

  product.status = "rejected";
  product.review.rejectReason = reason;
  product.review.reviewedBy = req.user._id;
  product.review.reviewedAt = new Date();
  await product.save();
  logAdmin(req.user, "reject_listing", "listing", product._id, `${wasLive ? "Took down" : "Rejected"} "${product.title}": ${reason}`);

  notify(product.user, {
    type: "listing_rejected",
    title: wasLive ? "Your listing was taken down" : "Your listing needs changes",
    message: `"${product.title}": ${reason}`,
    link: `/sell/${product._id}`,
  });

  res.json(product);
});

//
// USERS
//
router.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  const filter = search
    ? { $or: [{ name: { $regex: escapeRegex(search), $options: "i" } }, { email: { $regex: escapeRegex(search), $options: "i" } }] }
    : {};

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).limit(100).lean();
  const ids = users.map((u) => u._id);

  const [listingCounts, orderCounts] = await Promise.all([
    Product.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
  ]);

  const count = (rows) => Object.fromEntries(rows.map((r) => [r._id.toString(), r.n]));
  const listings = count(listingCounts);
  const orders = count(orderCounts);

  res.json(
    users.map((u) => ({
      ...u,
      listings: listings[u._id.toString()] || 0,
      orders: orders[u._id.toString()] || 0,
    }))
  );
});

router.patch("/users/:id/block", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role === "admin") {
    return res.status(400).json({ message: "Admins can't be blocked" });
  }

  const blocked = req.body.blocked !== false;
  user.blocked = blocked;
  await user.save();

  // A blocked seller's live listings come down with them
  if (blocked) {
    await Product.updateMany({ user: user._id, status: { $in: LIVE } }, { $set: { status: "paused" } });
  }

  logAdmin(req.user, blocked ? "block_user" : "unblock_user", "user", user._id, `${blocked ? "Blocked" : "Unblocked"} ${user.name} (${user.email})`);

  res.json({ _id: user._id, blocked: user.blocked });
});

//
// PROBLEM REPORTS
//
router.get("/disputes", async (req, res) => {
  const status = ["open", "refunded", "rejected"].includes(req.query.status) ? req.query.status : "open";
  const disputes = await Dispute.find(status === "open" ? { status } : { status: { $ne: "open" } })
    .sort({ createdAt: status === "open" ? 1 : -1 })
    .limit(100)
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("order", "items total status createdAt shipping paymentMethod")
    .populate("resolvedBy", "name")
    .lean();

  res.json(disputes.map((d) => ({ ...d, reasonLabel: DISPUTE_REASONS[d.reason] })));
});

// decision: "refund" (buyer gets their money back, order closes as refunded) or "reject" (order carries on)
router.patch("/disputes/:id/resolve", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Report not found" });
  }

  const { decision } = req.body;
  const note = readReason({ reason: req.body.note });

  if (!["refund", "reject"].includes(decision)) {
    return res.status(400).json({ message: "Choose to refund the buyer or reject the report" });
  }
  if (note.length < 5) {
    return res.status(400).json({ message: "Please explain your decision (at least 5 characters)" });
  }

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ message: "Report not found" });
  if (dispute.status !== "open") {
    return res.status(400).json({ message: "This report has already been resolved" });
  }

  const order = await Order.findById(dispute.order);

  dispute.status = decision === "refund" ? "refunded" : "rejected";
  dispute.resolution = note;
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  if (order) {
    if (decision === "refund") {
      order.status = "refunded";
      order.payment = { status: "refunded" };
    }
    order.timeline.push({
      status: decision === "refund" ? "refunded" : "dispute_closed",
      by: "admin",
      note,
    });
    await order.save();
  }

  const titles = order?.items.map((i) => i.title).join(", ") || "your order";
  const title = decision === "refund" ? "Problem report: buyer refunded" : "Problem report closed";
  notify(dispute.buyer, { type: "dispute_resolved", title, message: `${titles}: ${note}`, link: "/orders" });
  notify(dispute.seller, { type: "dispute_resolved", title, message: `${titles}: ${note}`, link: "/seller/orders" });

  logAdmin(req.user, decision === "refund" ? "refund_dispute" : "reject_dispute", "dispute", dispute._id, `${decision === "refund" ? "Refunded" : "Rejected report on"} ${titles}: ${note}`);

  res.json(dispute);
});

//
// ORDERS (overview)
//
router.get("/orders", async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "name email")
    .populate("items.seller", "name")
    .lean();

  res.json(orders);
});

export default router;
