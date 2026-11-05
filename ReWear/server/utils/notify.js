import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Never let a failed notification break the action that triggered it
export const notify = (userId, { type, title, message, link }) =>
  Notification.create({ user: userId, type, title, message, link }).catch((err) =>
    console.warn("Notification failed:", err.message)
  );

export const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(admins.map((a) => notify(a._id, payload)));
};
