import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { useWishlist } from "../../context/WishListContext";
import { cardImage, cardSrcSet, PLACEHOLDER_IMAGE } from "../../utils/image";
import { RatingBadge } from "../ui/Stars";
import VerifiedBadge from "../ui/VerifiedBadge";
import { money } from "../../utils/format";
import { categoryInfo } from "../../utils/catalog";

// Listed in the last two weeks (measured from when the page loaded)
const NEW_SINCE = Date.now() - 14 * 864e5;

const canSell = (p) => ["sell", "sale", "both"].includes(p.mode) && p.price > 0;
const canRent = (p) => ["rent", "both"].includes(p.mode) && p.rent > 0;

// Main price plus the other option, e.g. "₹6,500" + "or rent ₹900/day".
// `prefer` = "rent" shows the rental price first (Explore in rent mode).
const priceLines = (p, prefer) => {
  const sale = canSell(p);
  const rent = canRent(p);

  if (rent && (!sale || prefer === "rent")) {
    return { main: money(p.rent), unit: "/day", extra: sale ? `or buy for ${money(p.price)}` : "" };
  }

  return { main: money(p.price), unit: "", extra: rent ? `or rent ${money(p.rent)}/day` : "" };
};

const Badge = ({ children, className = "" }) => (
  <span className={`px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em] ${className}`}>{children}</span>
);

const ProductCard = ({ product, prefer }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const saved = wishlist.some((p) => p._id === product._id);
  const { main, unit, extra } = priceLines(product, prefer);
  const sold = product.status === "sold";
  const category = categoryInfo(product.category === "street wear" ? "streetwear" : product.category);
  const isNew = product.createdAt && new Date(product.createdAt).getTime() > NEW_SINCE;
  const href = `/product/${product._id}`;

  return (
    <article className="group flex flex-col">
      {/* PHOTO (the heart sits on it, bottom right) */}
      <div className="relative aspect-[3/4] bg-cream overflow-hidden">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block w-full h-full">
          <img
            src={cardImage(product.images?.[0], 400) || PLACEHOLDER_IMAGE}
            srcSet={cardSrcSet(product.images?.[0], 400)}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </Link>

        <span className="absolute top-2 left-2 flex flex-col items-start gap-1 pointer-events-none">
          {isNew && !sold && <Badge className="bg-white text-ink">New in</Badge>}
          {canRent(product) && !sold && <Badge className="bg-ink text-paper">Rent</Badge>}
        </span>
        {sold && (
          <span className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
            <Badge className="bg-ink text-paper text-[11px] px-2.5 py-1">Sold</Badge>
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
          aria-pressed={saved}
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white flex items-center justify-center text-ink shadow-card hover:scale-105 transition-transform"
        >
          <Heart size={17} className={saved ? "fill-brand text-brand" : ""} />
        </button>
      </div>

      {/* DETAILS */}
      <Link to={href} className="pt-2.5 pr-1 flex flex-col gap-0.5 text-ink">
        {category && (
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: category.color }}>
            {category.label}
          </span>
        )}
        <h3 className="text-[13px] leading-snug line-clamp-2 group-hover:underline underline-offset-2">{product.title}</h3>
        <p className="mt-0.5 text-[15px] font-bold">
          {main}
          {unit && <span className="text-xs font-medium text-muted"> {unit}</span>}
        </p>
        {extra && <span className="text-xs text-muted">{extra}</span>}
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted min-w-0">
          <span className="truncate">
            Size {product.size}
            {product.condition ? ` · ${product.condition}` : ""}
            {product.sellerName ? ` · ${product.sellerName}` : ""}
          </span>
          {product.sellerVerified && <VerifiedBadge size={12} className="flex-shrink-0" />}
          <RatingBadge rating={product.sellerRating} className="flex-shrink-0" />
        </span>
      </Link>
    </article>
  );
};

export default ProductCard;
