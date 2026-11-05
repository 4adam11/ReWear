import express from "express";
import mongoose from "mongoose";
import crypto from "node:crypto";
import Order, { ORDER_STATUSES } from "../models/Order.js";
import Product, { LIVE } from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notify } from "../utils/notify.js";
import Offer from "../models/Offer.js";
import Review from "../models/Review.js";
import Dispute from "../models/Dispute.js";
import { findUsableOffer } from "./offerRoutes.js";
import {
  DAY_MS,
  parseDay,
  todayUtc,
  upcomingRentals,
  hasRentalClash,
  withProductLocks,
} from "../utils/bookings.js";

const router = express.Router();

const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many orders, please try again later" });

// Promo codes live on the server so clients can't invent discounts
const PROMO_CODES = {
  REWEAR100: 100,
};

const MAX_RENT_DAYS = 60;

const canBuy = (p) => ["sell", "sale", "both"].includes(p.mode) && p.price > 0;
const canRent = (p) => ["rent", "both"].includes(p.mode) && p.rent > 0;

const fmt = (d) => d.toISOString().slice(0, 10);

// Turns the client's cart into priced order lines. Returns { error } or { items, subtotal }.
// Each listing is one physical second-hand item, so quantity is always 1.
const buildItems = async (rawItems, buyerId) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
    return { error: "Cart is empty or too large" };
  }

  const items = [];
  const seen = new Set();

  for (const raw of rawItems) {
    const productId = raw?.product || raw?._id;

    if (!mongoose.isValidObjectId(productId)) {
      return { error: "Invalid product in cart" };
    }

    if (seen.has(String(productId))) {
      return { error: "The same item is in your cart twice" };
    }
    seen.add(String(productId));

    if (raw.quantity !== undefined && Number(raw.quantity) !== 1) {
      return { error: "Each listing is a single item, so the quantity must be 1" };
    }

    const product = await Product.findById(productId);

    if (!product) {
      return { error: "A product in your cart is no longer available" };
    }

    if (product.user?.toString() === buyerId.toString()) {
      return { error: "You can't order your own listing" };
    }

    if (product.status === "sold") {
      return { error: `"${product.title}" has already been sold` };
    }

    // Only approved, active listings can be ordered (not in review, rejected or paused)
    if (!LIVE.includes(product.status)) {
      return { error: `"${product.title}" isn't available right now` };
    }

    const mode = raw.mode === "rent" ? "rent" : "sale";
    const line = {
      product: product._id,
      seller: product.user,
      title: product.title,
      image: product.images?.[0],
      mode,
      quantity: 1,
    };

    if (mode === "rent") {
      if (!canRent(product)) {
        return { error: `"${product.title}" is not available for rent` };
      }

      const rentStart = parseDay(raw.rentStart);
      const rentEnd = parseDay(raw.rentEnd);
      if (!rentStart || !rentEnd || rentEnd < rentStart) {
        return { error: `Please pick rental dates again for "${product.title}"` };
      }
      // One day of slack for time zones ahead of UTC
      if (rentStart < new Date(todayUtc() - DAY_MS)) {
        return { error: "Rental can't start in the past" };
      }

      // Both days inclusive, same as the product page
      const days = Math.round((rentEnd - rentStart) / DAY_MS) + 1;
      if (days > MAX_RENT_DAYS) {
        return { error: `Rentals are limited to ${MAX_RENT_DAYS} days` };
      }

      // Only enforce the seller's window if they actually picked a range
      const { startDate, endDate } = product.availability || {};
      if (startDate && endDate && endDate - startDate >= DAY_MS) {
        if (rentStart < parseDay(fmt(startDate)) || rentEnd > parseDay(fmt(endDate))) {
          return {
            error: `"${product.title}" can only be rented between ${fmt(startDate)} and ${fmt(endDate)}`,
          };
        }
      }

      if (await hasRentalClash(product._id, rentStart, rentEnd)) {
        return { error: `"${product.title}" is already booked for some of those dates` };
      }

      line.unitPrice = product.rent;
      line.rentStart = rentStart;
      line.rentEnd = rentEnd;
      line.days = days;
      line.lineTotal = product.rent * days;
    } else {
      if (!canBuy(product)) {
        return { error: `"${product.title}" is not for sale` };
      }

      if ((await upcomingRentals(product._id)).length > 0) {
        return { error: `"${product.title}" has upcoming rentals and can't be bought right now` };
      }

      line.unitPrice = product.price;

      // An accepted "make an offer" price, for this buyer only
      if (raw.offerId) {
        const offer = await findUsableOffer(raw.offerId, buyerId, product._id);
        if (!offer) {
          return { error: `Your accepted offer on "${product.title}" has expired or was already used` };
        }
        line.unitPrice = offer.amount;
        line.offer = offer._id;
      }

      line.lineTotal = line.unitPrice;
    }

    items.push(line);
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal };
};

const validateAddress = (address) => {
  if (!address || typeof address !== "object") return null;

  const name = typeof address.name === "string" ? address.name.trim() : "";
  const phone = typeof address.phone === "string" ? address.phone.trim() : "";
  const line = typeof address.address === "string" ? address.address.trim() : "";

  if (!name || name.length > 100) return null;
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) return null;
  if (!line || line.length > 500) return null;

  return { name, phone, address: line };
};

const readPromo = (body) =>
  typeof body.promoCode === "string" ? body.promoCode.trim().toUpperCase() : "";

//
// PREVIEW TOTAL (lets checkout show the same price the server will charge)
//
router.post("/quote", protect, async (req, res) => {
  const { error, items, subtotal } = await buildItems(req.body.items, req.user._id);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const code = readPromo(req.body);
  const discount = Math.min(PROMO_CODES[code] || 0, subtotal);

  res.json({
    items,
    subtotal,
    discount,
    promoValid: !code || code in PROMO_CODES,
    total: subtotal - discount,
  });
});

//
// CREATE ORDERS: one per seller, like split shipments on Amazon/Flipkart
//
router.post("/", protect, orderLimiter, async (req, res) => {
  const address = validateAddress(req.body.address);
  if (!address) {
    return res.status(400).json({ message: "Please enter a valid name, phone and address" });
  }

  const { paymentMethod } = req.body;
  if (!["card", "upi", "cod"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const code = readPromo(req.body);
  if (code && !(code in PROMO_CODES)) {
    return res.status(400).json({ message: "Invalid promo code" });
  }

  const productIds = Array.isArray(req.body.items)
    ? req.body.items.map((i) => i?.product || i?._id).filter((id) => mongoose.isValidObjectId(id))
    : [];

  // Lock these products so a parallel order can't buy/book them between the check and the save
  const result = await withProductLocks(productIds, async () => {
    const { error, items, subtotal } = await buildItems(req.body.items, req.user._id);

    if (error) return { status: 400, body: { message: error } };

    // Mark bought items as sold, only if they still are available
    const reserved = [];
    for (const item of items.filter((i) => i.mode === "sale")) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, status: { $in: LIVE } },
        { $set: { status: "sold" } }
      );

      if (!updated) {
        await Product.updateMany({ _id: { $in: reserved } }, { $set: { status: "live" } });
        return { status: 409, body: { message: `"${item.title}" was just sold to someone else` } };
      }
      reserved.push(item.product);
    }

    // Group lines by seller; the promo discount is shared out by order value
    const groups = new Map();
    for (const item of items) {
      const key = item.seller.toString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    const discount = Math.min(PROMO_CODES[code] || 0, subtotal);
    const checkoutId = crypto.randomUUID();
    const sellerGroups = [...groups.entries()];
    let discountLeft = discount;

    const docs = sellerGroups.map(([seller, lines], idx) => {
      const groupSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const share = idx === sellerGroups.length - 1
        ? discountLeft
        : Math.min(discountLeft, Math.round((discount * groupSubtotal) / subtotal));
      discountLeft -= share;

      return {
        user: req.user._id,
        seller,
        checkoutId,
        items: lines,
        subtotal: groupSubtotal,
        discount: share,
        promoCode: share ? code : undefined,
        total: groupSubtotal - share,
        paymentMethod,
        payment: { status: paymentMethod === "cod" ? "cod" : "simulated" },
        address,
        status: "confirmed",
        timeline: [{ status: "confirmed", by: "buyer" }],
      };
    });

    try {
      const orders = await Order.insertMany(docs);

      const offerIds = items.map((i) => i.offer).filter(Boolean);
      if (offerIds.length) {
        await Offer.updateMany({ _id: { $in: offerIds } }, { $set: { status: "used" } });
      }

      // Other buyers' open offers on items that just sold can't be used any more
      const soldIds = items.filter((i) => i.mode === "sale").map((i) => i.product);
      if (soldIds.length) {
        await Offer.updateMany(
          { product: { $in: soldIds }, status: { $in: ["pending", "countered", "accepted"] } },
          { $set: { status: "expired" } }
        );
      }
      return { status: 201, body: { checkoutId, orders } };
    } catch (err) {
      await Product.updateMany({ _id: { $in: reserved } }, { $set: { status: "live" } });
      throw err;
    }
  });

  if (result.status === 201) {
    for (const order of result.body.orders) {
      notify(order.seller, {
        type: "order_new",
        title: "New order to accept",
        message: `${order.items.map((i) => i.title).join(", ")} · ₹${order.total.toLocaleString("en-IN")}`,
        link: "/seller/orders",
      });
    }
  }

  res.status(result.status).json(result.body);
});

// Adds whether the buyer reviewed each order and any problem report on it
const withExtras = async (orders) => {
  const ids = orders.map((o) => o._id);
  const [reviews, disputes] = await Promise.all([
    Review.find({ order: { $in: ids } }).select("order rating").lean(),
    Dispute.find({ order: { $in: ids } }).sort({ createdAt: -1 }).lean(),
  ]);
  const reviewOf = new Map(reviews.map((r) => [r.order.toString(), r.rating]));
  const disputeOf = new Map();
  disputes.forEach((d) => {
    if (!disputeOf.has(d.order.toString())) disputeOf.set(d.order.toString(), d);
  });

  return orders.map((o) => ({
    ...o,
    reviewRating: reviewOf.get(o._id.toString()) || null,
    dispute: disputeOf.get(o._id.toString()) || null,
  }));
};

//
// BUYER: my orders
//
router.get("/", protect, async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate("seller", "name")
    .lean();

  res.json(await withExtras(orders));
});

//
// SELLER: orders for my listings (every status), with the buyer's delivery details
// ?status=confirmed|accepted|shipped|delivered|completed|cancelled
//
router.get("/sales", protect, async (req, res) => {
  const filter = {
    $or: [{ seller: req.user._id }, { seller: { $exists: false }, "items.seller": req.user._id }],
  };

  if (typeof req.query.status === "string" && ORDER_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("user", "name").lean();

  // Only expose this seller's lines (older orders could mix sellers)
  const sales = orders.map((o) => {
    const items = o.items.filter((i) => i.seller?.toString() === req.user._id.toString());

    return {
      ...o,
      items,
      buyer: o.user?.name,
      user: undefined,
      earnings: ["cancelled", "refunded"].includes(o.status) ? 0 : items.reduce((sum, i) => sum + i.lineTotal, 0) - (o.discount || 0),
    };
  });

  res.json(await withExtras(sales));
});

//
// STATUS CHANGES
// Each action says who may do it and from which statuses.
//
const ACTIONS = {
  accept: { by: ["seller"], from: ["confirmed"], to: "accepted" },
  ship: { by: ["seller"], from: ["accepted"], to: "shipped" },
  deliver: { by: ["buyer", "seller"], from: ["shipped"], to: "delivered" },
  complete: { by: ["buyer"], from: ["delivered"], to: "completed", sale: true },
  return: { by: ["seller"], from: ["delivered"], to: "completed", rental: true },
  cancel: { by: ["buyer", "seller", "admin"], from: ["confirmed", "accepted"], to: "cancelled" },
};

const MESSAGES = {
  accepted: { who: "buyer", title: "Your order was accepted", text: "The seller is preparing it for shipping." },
  shipped: { who: "buyer", title: "Your order has shipped", text: "Track it from your orders page." },
  delivered: { who: "both", title: "Order delivered", text: "Let us know if everything is as described." },
  completed: { who: "both", title: "Order completed", text: "Thanks for shopping second-hand!" },
  cancelled: { who: "both", title: "Order cancelled", text: "" },
};

const isRental = (order) => order.items.some((i) => i.mode === "rent");

router.patch("/:id/:action", protect, async (req, res) => {
  const name = req.params.action;
  const action = ACTIONS[name];
  if (!action || !mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Not found" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const me = req.user._id.toString();
  const sellerId = (order.seller || order.items[0]?.seller)?.toString();
  const role =
    order.user.toString() === me ? "buyer"
      : sellerId === me ? "seller"
        : req.user.role === "admin" ? "admin"
          : null;

  if (!role || !action.by.includes(role)) {
    return res.status(403).json({ message: "You can't do that on this order" });
  }

  const current = order.status === "placed" ? "confirmed" : order.status;
  if (!action.from.includes(current)) {
    return res.status(400).json({ message: `This order is already ${current}` });
  }

  if (action.sale && isRental(order)) {
    return res.status(400).json({ message: "Rentals are completed when the seller confirms the item was returned" });
  }
  if (action.rental && !isRental(order)) {
    return res.status(400).json({ message: "Only rentals can be marked as returned" });
  }

  // An admin decides orders with an open problem report
  if (["complete", "return"].includes(name) && (await Dispute.exists({ order: order._id, status: "open" }))) {
    return res.status(400).json({ message: "There's an open problem report on this order. A ReWear admin will resolve it." });
  }

  const note = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";

  if (name === "ship") {
    const courier = typeof req.body.courier === "string" ? req.body.courier.trim().slice(0, 60) : "";
    const trackingNumber = typeof req.body.trackingNumber === "string" ? req.body.trackingNumber.trim().slice(0, 60) : "";

    if (!courier || !trackingNumber) {
      return res.status(400).json({ message: "Please enter the courier and tracking number" });
    }
    order.shipping = { courier, trackingNumber };
  }

  if (name === "cancel") {
    if (role !== "buyer" && note.length < 5) {
      return res.status(400).json({ message: "Please tell the buyer why (at least 5 characters)" });
    }
    order.cancel = { by: role, reason: note || undefined };
  }

  order.status = action.to;
  order.timeline.push({
    status: name === "return" ? "returned" : action.to,
    by: role,
    note: name === "ship"
      ? `${order.shipping.courier} · ${order.shipping.trackingNumber}`
      : note || undefined,
  });
  if (name === "return") {
    order.timeline.push({ status: "completed", by: "system" });
  }

  await order.save();

  // Bought items go back on sale when an order is cancelled
  if (action.to === "cancelled") {
    const sold = order.items.filter((i) => i.mode === "sale").map((i) => i.product);
    if (sold.length) {
      await Product.updateMany({ _id: { $in: sold }, status: "sold" }, { $set: { status: "live" } });
    }
  }

  // Tell the other side
  const msg = MESSAGES[action.to];
  if (msg) {
    const titles = order.items.map((i) => i.title).join(", ");
    const text = action.to === "cancelled"
      ? `Cancelled by the ${role}${note ? `: ${note}` : "."}`
      : action.to === "shipped"
        ? `${msg.text} ${order.shipping.courier}, tracking ${order.shipping.trackingNumber}.`
        : msg.text;

    if (role !== "buyer" && (msg.who === "buyer" || msg.who === "both")) {
      notify(order.user, { type: `order_${action.to}`, title: msg.title, message: `${titles}. ${text}`, link: "/orders" });
    }
    if (role !== "seller" && msg.who === "both" && sellerId) {
      notify(sellerId, { type: `order_${action.to}`, title: msg.title, message: `${titles}. ${text}`, link: "/seller/orders" });
    }
  }

  res.json(order);
});

export default router;
