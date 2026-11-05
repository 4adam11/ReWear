import AdminLog from "../models/AdminLog.js";

// Never let logging break the admin action itself
export const logAdmin = (admin, action, targetType, targetId, summary) =>
  AdminLog.create({ admin: admin._id, action, targetType, targetId, summary }).catch((err) =>
    console.warn("Admin log failed:", err.message)
  );
