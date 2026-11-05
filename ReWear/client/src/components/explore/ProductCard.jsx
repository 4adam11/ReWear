import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { useWishlist } from "../../context/WishListContext";
import { thumb, PLACEHOLDER_IMAGE } from "../../utils/image";

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

const ProductCard = ({ product, prefer }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const saved = wishlist.some((p) => p._id === product._id);
  const { main, unit, extra } = priceLines(product, prefer);
  const sold = product.status === "sold";

  return (
    <article className="group relative flex flex-col bg-white border border-line rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/product/${product._id}`} className="flex flex-col flex-1 text-ink">
        <div className="relative aspect-[3/4] bg-cream overflow-hidden">
          <img
            src={thumb(product.images?.[0], 500) || PLACEHOLDER_IMAGE}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />

          {canRent(product) && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-ink text-paper text-[11px] font-semibold">
              Rent
            </span>
          )}
          {sold && (
            <span className="absolute inset-x-0 bottom-0 py-1.5 bg-white/90 text-center text-xs font-semibold text-ink">
              Sold
            </span>
          )}
        </div>

        <div className="px-3 pt-2.5 pb-3.5 flex flex-col gap-0.5">
          {product.sellerName && <span className="text-xs text-muted truncate">{product.sellerName}</span>}
          <h3 className="text-sm font-medium truncate">{product.title}</h3>
          <span className="text-xs text-muted">
            Size {product.size}
            {product.condition ? ` · ${product.condition}` : ""}
          </span>
          <p className="mt-1 text-base font-bold">
            {main}
            {unit && <span className="text-xs font-medium text-muted"> {unit}</span>}
          </p>
          {extra && <span className="text-xs text-muted">{extra}</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-ink hover:bg-white shadow-sm"
      >
        <Heart size={17} className={saved ? "fill-brand text-brand" : ""} />
      </button>
    </article>
  );
};

export default ProductCard;
