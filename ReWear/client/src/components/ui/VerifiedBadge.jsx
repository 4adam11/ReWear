import { BadgeCheck } from "lucide-react";

// Shown next to a seller's name once an admin has verified them
const VerifiedBadge = ({ size = 14, label = false, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 text-info ${className}`}
    title="Verified seller: checked by the ReWear team"
  >
    <BadgeCheck size={size} aria-hidden="true" className="flex-shrink-0" />
    {label ? (
      <span className="text-xs font-semibold">Verified seller</span>
    ) : (
      <span className="sr-only">Verified seller</span>
    )}
  </span>
);

export default VerifiedBadge;
