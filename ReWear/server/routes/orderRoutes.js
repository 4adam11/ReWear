import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";
import {
  DAY_MS,
  parseDay,
  todayUtc,
  upcomingRentals,
  hasRentalClash,
  withProductLocks,
} from "../utils/bookings.js";

const router = express.Router();

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
      line.lineTotal = product.price;
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
// CREATE ORDER
//
router.post("/", protect, async (req, res) => {
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
        { _id: item.product, status: { $ne: "sold" } },
        { $set: { status: "sold" } }
      );

      if (!updated) {
        await Product.updateMany({ _id: { $in: reserved } }, { $set: { status: "available" } });
        return { status: 409, body: { message: `"${item.title}" was just sold to someone else` } };
      }
      reserved.push(item.product);
    }

    const discount = Math.min(PROMO_CODES[code] || 0, subtotal);

    try {
      const order = await Order.create({
        user: req.user._id,
        items,
        subtotal,
        discount,
        promoCode: code || undefined,
        total: subtotal - discount,
        paymentMethod,
        address,
      });

      return { status: 201, body: order };
    } catch (err) {
      await Product.updateMany({ _id: { $in: reserved } }, { $set: { status: "available" } });
      throw err;
    }
  });

  res.status(result.status).json(result.body);
});

//
// GET USER ORDERS
//
router.get("/", protect, async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  }).sort({ createdAt: -1 }).lean();

  res.json(orders);
});

//
// GET SALES (orders that include the current user's listings)
//
router.get("/sales", protect, async (req, res) => {
  const orders = await Order.find({
    "items.seller": req.user._id,
    status: { $ne: "cancelled" },
  }).sort({ createdAt: -1 }).lean();

  // Only expose this seller's lines and the buyer's delivery details
  const sales = orders.map((o) => {
    const items = o.items.filter(
      (i) => i.seller?.toString() === req.user._id.toString()
    );

    return {
      _id: o._id,
      createdAt: o.createdAt,
      address: o.address,
      items,
      earnings: items.reduce((sum, i) => sum + i.lineTotal, 0),
    };
  });

  res.json(sales);
});

//
// CANCEL ORDER (orders are kept for history instead of being deleted)
//
router.patch("/:id/cancel", protect, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (order.status === "cancelled") {
    return res.status(400).json({ message: "This order is already cancelled" });
  }

  const started = order.items.some((i) => i.mode === "rent" && i.rentStart <= todayUtc());
  if (started) {
    return res.status(400).json({ message: "A rental in this order has already started" });
  }

  order.status = "cancelled";
  await order.save();

  // Bought items go back on sale
  const sold = order.items.filter((i) => i.mode === "sale").map((i) => i.product);
  if (sold.length) {
    await Product.updateMany({ _id: { $in: sold } }, { $set: { status: "available" } });
  }

  res.json(order);
});

export default router;
