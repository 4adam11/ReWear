import jwt from "jsonwebtoken";

// Read at call time so dotenv has loaded; server.js refuses to start without it
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
};

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "7d"
  });
};

export default generateToken;
