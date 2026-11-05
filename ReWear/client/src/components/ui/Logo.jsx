import { useId } from "react";

// ReWear mark: a "pre-loved" thrift price tag with a heart.
// Same drawing as public/favicon.svg (the browser-tab icon), so they always match.
export const LogoMark = ({ size = 36, className = "" }) => {
  // Unique id so several logos on one page don't clash
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a3826" />
          <stop offset="0.55" stopColor="#8b5e3c" />
          <stop offset="1" stopColor="#c0834f" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill={`url(#${uid}-bg)`} />

      {/* STRING */}
      <path
        d="M16 11.5 C8.5 19 11 32 21.1 39.3"
        fill="none"
        stroke="#f6ead8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* TAG + HEART */}
      <g transform="rotate(-24 33 34)">
        <path
          d="M22.5 22 h22 a4.5 4.5 0 0 1 4.5 4.5 v15 a4.5 4.5 0 0 1 -4.5 4.5 h-22 l-10 -12 z"
          fill="#f6ead8"
        />
        <circle cx="20" cy="34" r="2.6" fill="#8b5e3c" />
        <path
          d="M35.5 40.5 l-6.2 -6 a3.7 3.7 0 1 1 6.2 -4.2 a3.7 3.7 0 1 1 6.2 4.2 z"
          fill="#c0834f"
        />
      </g>
    </svg>
  );
};

// Mark + wordmark, as used in the navbar and footer
const Logo = ({ size = 36, textClassName = "" }) => (
  <span className="inline-flex items-center gap-2.5">
    <LogoMark size={size} className="flex-shrink-0 drop-shadow-sm" />
    <span className={textClassName}>ReWear</span>
  </span>
);

export default Logo;
