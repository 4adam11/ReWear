import express from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Product, { LIVE } from "../models/Product.js";
import protect from "../middleware/authMiddleware.js";
import rateLimit from "../middleware/rateLimit.js";
import { notify } from "../utils/notify.js";

const router = express.Router();

// Every chat route needs a logged-in user
router.use(protect);

const sendLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 60, message: "You're sending messages too quickly, please wait a moment" });

const PAGE = 100;

const readBody = (req) => (typeof req.body.body === "string" ? req.body.body.trim().slice(0, 1000) : "");

// Works whether buyer/seller are plain ids or populated users
const idOf = (ref) => (ref?._id || ref)?.toString();

const sideOf = (conversation, userId) =>
  idOf(conversation.buyer) === userId.toString() ? "buyer"
    : idOf(conversation.seller) === userId.toString() ? "seller"
      : null;

// What the chat list and header need, from this user's point of view
const present = (c, userId) => {
  const side = sideOf(c, userId);
  const other = side === "buyer" ? c.seller : c.buyer;

  return {
    _id: c._id,
    product: c.product?._id || c.product,
    productTitle: c.product?.title || c.productTitle,
    productImage: c.product?.images?.[0] || c.productImage,
    productStatus: c.product?.status || "removed",
    price: c.product?.price,
    rent: c.product?.rent,
    role: side,
    other: { _id: other?._id || other, name: other?.name || "ReWear user" },
    lastMessage: c.lastMessage,
    lastMine: c.lastSender?.toString() === userId.toString(),
    lastAt: c.lastAt,
    unread: side === "buyer" ? c.unreadBuyer : c.unreadSeller,
  };
};

const withPeople = (query) =>
  query.populate("buyer", "name").populate("seller", "name").populate("product", "title images status price rent");

// Adds a message, bumps the other side's unread count and alerts them (once, not per message)
const addMessage = async (conversation, sender, body) => {
  const side = sideOf(conversation, sender._id);
  const otherUnread = side === "buyer" ? "unreadSeller" : "unreadBuyer";
  const hadUnread = conversation[otherUnread] > 0;

  const message = await Message.create({ conversation: conversation._id, sender: sender._id, body });

  conversation.lastMessage = body.slice(0, 200);
  conversation.lastSender = sender._id;
  conversation.lastAt = message.createdAt;
  conversation[otherUnread] += 1;
  // Replying means you have seen the chat
  conversation[side === "buyer" ? "unreadBuyer" : "unreadSeller"] = 0;
  await conversation.save();

  if (!hadUnread) {
    notify(side === "buyer" ? conversation.seller : conversation.buyer, {
      type: "message_new",
      title: `New message from ${sender.name.split(" ")[0]}`,
      message: `About "${conversation.productTitle}": ${body.slice(0, 100)}`,
      link: `/messages/${conversation._id}`,
    });
  }

  return message;
};

//
// MY CHATS (as buyer or seller), newest first
//
router.get("/", async (req, res) => {
  const chats = await withPeople(
    Conversation.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] }).sort({ lastAt: -1 }).limit(100)
  ).lean();

  res.json(chats.map((c) => present(c, req.user._id)));
});

// Unread total for the header badge
router.get("/unread", async (req, res) => {
  const [asBuyer, asSeller] = await Promise.all([
    Conversation.aggregate([{ $match: { buyer: req.user._id } }, { $group: { _id: null, n: { $sum: "$unreadBuyer" } } }]),
    Conversation.aggregate([{ $match: { seller: req.user._id } }, { $group: { _id: null, n: { $sum: "$unreadSeller" } } }]),
  ]);

  res.json({ unread: (asBuyer[0]?.n || 0) + (asSeller[0]?.n || 0) });
});

//
// Before the first message: the listing being asked about, and my existing chat on it (if any)
//
router.get("/for/:productId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const product = await Product.findById(req.params.productId).select("title images status price rent user").populate("user", "name").lean();
  if (!product || ![...LIVE, "sold"].includes(product.status)) {
    return res.status(404).json({ message: "Listing not found" });
  }
  if (product.user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "This is your own listing. Buyers' messages appear in your Messages." });
  }

  const existing = await Conversation.findOne({ product: product._id, buyer: req.user._id }).select("_id").lean();

  res.json({
    conversation: existing?._id || null,
    product: { _id: product._id, title: product.title, image: product.images?.[0], status: product.status, price: product.price, rent: product.rent },
    seller: { _id: product.user._id, name: product.user.name },
  });
});

//
// START A CHAT (buyer asks the seller about a listing). Sending again continues the same chat.
//
router.post("/", sendLimiter, async (req, res) => {
  const { productId } = req.body;
  const body = readBody(req);

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid listing" });
  }
  if (!body) {
    return res.status(400).json({ message: "Write a message first" });
  }

  const product = await Product.findById(productId).select("title images status user");
  if (!product || ![...LIVE, "sold"].includes(product.status)) {
    return res.status(404).json({ message: "Listing not found" });
  }
  if (product.user.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't message yourself about your own listing" });
  }

  // Upsert so two quick sends can't create two chats
  const conversation = await Conversation.findOneAndUpdate(
    { product: product._id, buyer: req.user._id },
    { $setOnInsert: { seller: product.user, productTitle: product.title, productImage: product.images?.[0] } },
    { upsert: true, new: true }
  );

  const message = await addMessage(conversation, req.user, body);
  res.status(201).json({ conversation: conversation._id, message });
});

const findMine = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: "Chat not found" });
    return null;
  }

  const conversation = await Conversation.findById(req.params.id);
  // Same answer for "doesn't exist" and "not yours"
  if (!conversation || !sideOf(conversation, req.user._id)) {
    res.status(404).json({ message: "Chat not found" });
    return null;
  }

  return conversation;
};

//
// MESSAGES in one chat (also marks them as read for me).
// ?after=<ISO time> returns only newer messages, for the page's refresh.
//
router.get("/:id/messages", async (req, res) => {
  const conversation = await findMine(req, res);
  if (!conversation) return;

  const filter = { conversation: conversation._id };
  const after = typeof req.query.after === "string" ? new Date(req.query.after) : null;
  if (after && !isNaN(after)) filter.createdAt = { $gt: after };

  // The latest PAGE messages, returned oldest first
  const messages = (await Message.find(filter).sort({ createdAt: -1 }).limit(PAGE).lean()).reverse();

  const mine = sideOf(conversation, req.user._id) === "buyer" ? "unreadBuyer" : "unreadSeller";
  if (conversation[mine] > 0) {
    conversation[mine] = 0;
    await conversation.save();
  }

  const full = await withPeople(Conversation.findById(conversation._id)).lean();
  res.json({ conversation: present(full, req.user._id), messages });
});

//
// SEND a message in an existing chat (either side)
//
router.post("/:id/messages", sendLimiter, async (req, res) => {
  const conversation = await findMine(req, res);
  if (!conversation) return;

  const body = readBody(req);
  if (!body) {
    return res.status(400).json({ message: "Write a message first" });
  }

  res.status(201).json(await addMessage(conversation, req.user, body));
});

export default router;
