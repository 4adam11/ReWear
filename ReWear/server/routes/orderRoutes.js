import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Promo codes live on the server so clients can't invent discounts
const PROMO_CODES = {
  REWEAR100: 100,
};

const MAX_RENT_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

const canBuy = (p) => ["sell", "sale", "both"].includes(p.mode) && p.price > 0;
const canRent = (p) => ["rent", "both"].includes(p.mode) && p.rent > 0;

// Turns the client's cart into priced order lines. Returns { error } or { items, subtotal }.
const buildItems = async (rawItems, buyerId) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
    return { error: "Cart is empty or too large" };
  }

  const items = [];

  for (const raw of rawItems) {
    const productId = raw?.product || raw?._id;

    if (!mongoose.isValidObjectId(productId)) {
      return { error: "Invalid product in cart" };
    }

    const product = await Product.findById(productId);

    if (!product) {
      return { error: "A product in your cart is no longer available" };
    }

    if (product.user?.toString() === buyerId.toString()) {
      return { error: "You can't order your own listing" };
    }

    const quantity = Number(raw.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { error: "Invalid quantity" };
    }

    const mode = raw.mode === "rent" ? "rent" : "sale";
    const line = {
      product: product._id,
      seller: product.user,
      title: product.title,
      image: product.images?.[0],
      mode,
      quantity,
    };

    if (mode === "rent") {
      if (!canRent(product)) {
        return { error: `"${product.title}" is not available for rent` };
      }

      const rentStart = new Date(raw.rentStart);
      const rentEnd = new Date(raw.rentEnd);
      if (isNaN(rentStart) || isNaN(rentEnd) || rentEnd < rentStart) {
        return { error: "Invalid rental dates" };
      }
      if (rentStart < new Date(Date.now() - DAY_MS)) {
        return { error: "Rental can't start in the past" };
      }

      // Same rule as the product page: both days inclusive
      const days = Math.floor((rentEnd - rentStart) / DAY_MS) + 1;
      if (days > MAX_RENT_DAYS) {
        return { error: `Rentals are limited to ${MAX_RENT_DAYS} days` };
      }

      line.unitPrice = product.rent;
      line.rentStart = rentStart;
      line.rentEnd = rentEnd;
      line.days = days;
      line.lineTotal = product.rent * days * quantity;
    } else {
      if (!canBuy(product)) {
        return { error: `"${product.title}" is not for sale` };
      }

      line.unitPrice = product.price;
      line.lineTotal = product.price * quantity;
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

//
// PREVIEW TOTAL (lets checkout show the same price the server will charge)
//
router.post("/quote", protect, async (req, res) => {
  const { error, items, subtotal } = await buildItems(req.body.items, req.user._id);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const code = typeof req.body.promoCode === "string" ? req.body.promoCode.trim().toUpperCase() : "";
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
  const { error, items, subtotal } = await buildItems(req.body.items, req.user._id);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const address = validateAddress(req.body.address);
  if (!address) {
    return res.status(400).json({ message: "Please enter a valid name, phone and address" });
  }

  const { paymentMethod } = req.body;
  if (!["card", "upi", "cod"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const code = typeof req.body.promoCode === "string" ? req.body.promoCode.trim().toUpperCase() : "";
  if (code && !(code in PROMO_CODES)) {
    return res.status(400).json({ message: "Invalid promo code" });
  }
  const discount = Math.min(PROMO_CODES[code] || 0, subtotal);

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

  res.status(201).json(order);
});

//
// GET USER ORDERS
//
router.get("/", protect, async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(orders);
});

//
// GET SALES (orders that include the current user's listings)
//
router.get("/sales", protect, async (req, res) => {
  const orders = await Order.find({
    "items.seller": req.user._id,
    status: { $ne: "cancelled" },
  }).sort({ createdAt: -1 });

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
// DELETE ORDER
//
router.delete("/:id", protect, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  await order.deleteOne();

  res.json({
    message: "Order deleted successfully",
  });
});

export default router;
