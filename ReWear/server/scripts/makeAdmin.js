// Gives an existing account admin rights:   npm run make-admin -- someone@example.com
// Remove them again with:                   npm run make-admin -- someone@example.com --remove
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv.find((a) => a.includes("@"));
const remove = process.argv.includes("--remove");

if (!email) {
  console.error("Usage: npm run make-admin -- someone@example.com [--remove]");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOneAndUpdate(
  { email: email.trim().toLowerCase() },
  { $set: { role: remove ? "user" : "admin" } },
  { new: true }
);

console.log(
  user
    ? `${user.name} <${user.email}> is now ${user.role === "admin" ? "an admin" : "a regular user"}. Log out and back in to see the change.`
    : `No account with email ${email}. Register on the site first.`
);

await mongoose.disconnect();
