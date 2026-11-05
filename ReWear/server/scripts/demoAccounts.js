// Creates (or resets) three accounts for presenting the project:
//   npm run demo-accounts
// They all use DEMO_PASSWORD from .env. If it isn't set, a random one is generated and printed.
import "dotenv/config";
import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const ACCOUNTS = [
  { name: "Priya Buyer", email: "buyer@rewear.local", role: "user" },
  { name: "Kabir Seller", email: "seller@rewear.local", role: "user" },
  { name: "ReWear Admin", email: "admin@rewear.local", role: "admin" },
];

const password = process.env.DEMO_PASSWORD || crypto.randomBytes(9).toString("base64url");

if (password.length < 8) {
  console.error("DEMO_PASSWORD must be at least 8 characters");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const hash = await bcrypt.hash(password, 10);

for (const a of ACCOUNTS) {
  await User.findOneAndUpdate(
    { email: a.email },
    { $set: { name: a.name, role: a.role, password: hash, blocked: false } },
    { upsert: true, new: true }
  );
  console.log(`${a.role === "admin" ? "admin " : "user  "} ${a.email}  (${a.name})`);
}

console.log(
  process.env.DEMO_PASSWORD
    ? "\nPassword: the DEMO_PASSWORD from your .env file"
    : `\nPassword for all three: ${password}\n(Set DEMO_PASSWORD in .env to keep the same one every time.)`
);

await mongoose.disconnect();
