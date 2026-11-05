import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import rateLimit from "../middleware/rateLimit.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts, please try again later"
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Case-insensitive match so existing mixed-case emails still work
const findByEmail = (email) =>
  User.findOne({ email }).collation({ locale: "en", strength: 2 });

const isString = (v) => typeof v === "string";

// ================= REGISTER =================
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Reject objects like { "$ne": null } before they reach a query
    if (!isString(name) || !isString(email) || !isString(password)) {
      return res.status(400).json({ message: "All fields required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be 8 to 128 characters" });
    }

    if (cleanName.length > 100 || cleanEmail.length > 254) {
      return res.status(400).json({ message: "Name or email is too long" });
    }

    const existingUser = await findByEmail(cleanEmail);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= LOGIN =================
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isString(email) || !isString(password) || !email || !password || password.length > 128) {
      return res.status(400).json({ message: "Email & Password required" });
    }

    const user = await findByEmail(email.trim().toLowerCase());

    // Same message for unknown email and wrong password (no user enumeration)
    const match = user && await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.blocked) {
      return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= CURRENT USER =================
// Lets the site pick up role changes (e.g. made admin) without logging out
router.get("/me", protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ _id, name, email, role });
});

export default router;
