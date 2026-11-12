// One look for listing and order statuses everywhere. Tones come from DESIGN.md "Status".
const TONE = {
  success: "bg-success-tint text-success-strong border-success-line",
  done: "bg-success text-white border-success",
  info: "bg-info-tint text-info-strong border-info-line",
  warning: "bg-warning-tint text-warning-strong border-warning-line",
  danger: "bg-danger-tint text-danger-strong border-danger-line",
  brand: "bg-cream text-brand border-line-strong",
  neutral: "bg-sand text-muted border-line",
};

const STYLES = {
  pending: ["In review", "warning"],
  live: ["Live", "success"],
  available: ["Live", "success"],
  rejected: ["Rejected", "danger"],
  paused: ["Paused", "neutral"],
  sold: ["Sold", "brand"],
  placed: ["Confirmed", "info"],
  confirmed: ["Confirmed", "info"],
  accepted: ["Accepted", "info"],
  shipped: ["Shipped", "brand"],
  delivered: ["Delivered", "success"],
  completed: ["Completed", "done"],
  cancelled: ["Cancelled", "danger"],
  refunded: ["Refunded", "neutral"],
  open: ["Open", "warning"],
  countered: ["Countered", "info"],
  withdrawn: ["Withdrawn", "neutral"],
  used: ["Bought", "success"],
  expired: ["Expired", "neutral"],
  blocked: ["Blocked", "danger"],
  admin: ["Admin", "brand"],
  flagged: ["AI flagged", "warning"],
};

const StatusBadge = ({ status, className = "" }) => {
  const [label, tone] = STYLES[status] || [status, "neutral"];
  return <span className={`chip ${TONE[tone]} ${className}`}>{label}</span>;
};

export default StatusBadge;
