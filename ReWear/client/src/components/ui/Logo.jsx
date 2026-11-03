import { useId } from "react";

// ReWear mark: a dress on a clothes hanger.
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
          <stop offset="0" stopColor="#2f7d5b" />
          <stop offset="0.55" stopColor="#6a8a55" />
          <stop offset="1" stopColor="#d4623a" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill={`url(#${uid}-bg)`} />

      {/* HANGER */}
      <path
        d="M29.6 12.6 a2.4 2.4 0 1 1 2.4 2.4 v2.4 l-11 6.4 h22 l-11 -6.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* DRESS */}
      <path
        d="M25.6 26 h3.6 l2.8 3.4 l2.8 -3.4 h3.6 l-1.1 10.6 q6.2 7.8 9.2 17 q-14.5 4.3 -29 0 q3 -9.2 9.2 -17 z"
        fill="#fff"
      />

      {/* WAIST */}
      <path
        d="M27.5 36.7 h9"
        stroke="#2f7d5b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
