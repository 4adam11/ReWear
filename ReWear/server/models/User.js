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
  phone: { type: String, maxlength: 15 },
  // Saved delivery addresses (filled in at checkout)
  addresses: [{
    name: { type: String, required: true, maxlength: 100 },
    phone: { type: String, required: true, maxlength: 15 },
    line: { type: String, required: true, maxlength: 300 },
    city: { type: String, required: true, maxlength: 80 },
    state: { type: String, required: true, maxlength: 80 },
    pincode: { type: String, required: true, maxlength: 6 },
  }],
  // Seller rating from buyer reviews (kept up to date when a review is posted)
  rating: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  // Blocked users can't log in or use the API (set by an admin)
  blocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
