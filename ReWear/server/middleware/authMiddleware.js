import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../utils/generateToken.js";

const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.slice("Bearer ".length).trim();

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }

  const user = await User.findById(decoded.id).select("-password");

  // Valid token for a user that no longer exists
  if (!user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  req.user = user;
  next();
};

export default protect;
