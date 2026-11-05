import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // Every user can buy and sell; admins also review listings and manage users/orders.
  // Make an admin with: npm run make-admin -- someone@example.com
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  // Blocked users can't log in or use the API (set by an admin)
  blocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
