import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../utils/generateToken.js";

// Returns the logged-in user for a request, or a { status, message } error
const authenticate = async (req) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return { error: { status: 401, message: "Please log in first" } };
  }

  const token = header.slice("Bearer ".length).trim();

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
  } catch {
    return { error: { status: 401, message: "Your session has expired, please log in again" } };
  }

  const user = await User.findById(decoded.id).select("-password");

  // Valid token for a user that no longer exists (deleted, or a different database)
  if (!user) {
    return { error: { status: 401, message: "Your account was not found, please log in again" } };
  }

  if (user.blocked) {
    return { error: { status: 403, message: "Your account has been blocked. Contact support." } };
  }

  // Changing the password signs out every other session
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    return { error: { status: 401, message: "Your password was changed, please log in again" } };
  }

  return { user };
};

const protect = async (req, res, next) => {
  const { user, error } = await authenticate(req);

  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  req.user = user;
  next();
};

// Sets req.user when a valid token is sent, but lets anonymous visitors through
export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization) {
    const { user } = await authenticate(req);
    if (user) req.user = user;
  }

  next();
};

// Use after protect
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }

  next();
};

export default protect;
