import { Star } from "lucide-react";

// Read-only stars, e.g. a seller's average
export const Stars = ({ value = 0, size = 14 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        aria-hidden="true"
        className={n <= Math.round(value) ? "fill-caramel text-caramel" : "fill-line-soft text-line-strong"}
      />
    ))}
  </span>
);

// "4.6 ★ (12)" next to a seller's name
export const RatingBadge = ({ rating, className = "" }) =>
  rating?.count ? (
    <span className={`inline-flex items-center gap-1 text-xs text-muted ${className}`}>
      <Star size={12} aria-hidden="true" className="fill-caramel text-caramel" />
      <span className="font-semibold text-ink">{rating.avg.toFixed(1)}</span>({rating.count})
    </span>
  ) : null;

// Clickable 1-5 picker for writing a review
export const StarPicker = ({ value, onChange }) => (
  <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        onClick={() => onChange(n)}
        className="p-1"
      >
        <Star size={26} className={n <= value ? "fill-caramel text-caramel" : "fill-white text-line-strong hover:text-caramel"} />
      </button>
    ))}
  </div>
);
