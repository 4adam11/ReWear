// One look for listing and order statuses everywhere
const STYLES = {
  pending: { label: "In review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  live: { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  available: { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  paused: { label: "Paused", className: "bg-gray-100 text-gray-600 border-gray-200" },
  sold: { label: "Sold", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  placed: { label: "Confirmed", className: "bg-sky-50 text-sky-700 border-sky-200" },
  confirmed: { label: "Confirmed", className: "bg-sky-50 text-sky-700 border-sky-200" },
  accepted: { label: "Accepted", className: "bg-sky-50 text-sky-700 border-sky-200" },
  shipped: { label: "Shipped", className: "bg-violet-50 text-violet-700 border-violet-200" },
  delivered: { label: "Delivered", className: "bg-teal-50 text-teal-700 border-teal-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-700 border-gray-200" },
  open: { label: "Open", className: "bg-amber-50 text-amber-700 border-amber-200" },
  countered: { label: "Countered", className: "bg-sky-50 text-sky-700 border-sky-200" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-600 border-gray-200" },
  used: { label: "Bought", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-600 border-gray-200" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700 border-red-200" },
  admin: { label: "Admin", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  flagged: { label: "AI flagged", className: "bg-orange-50 text-orange-700 border-orange-200" },
};

const StatusBadge = ({ status, className = "" }) => {
  const style = STYLES[status] || { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
};

export default StatusBadge;
