// One look for listing and order statuses everywhere
const STYLES = {
  pending: { label: "In review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  live: { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  available: { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  paused: { label: "Paused", className: "bg-gray-100 text-gray-600 border-gray-200" },
  sold: { label: "Sold", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  placed: { label: "Placed", className: "bg-sky-50 text-sky-700 border-sky-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
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
