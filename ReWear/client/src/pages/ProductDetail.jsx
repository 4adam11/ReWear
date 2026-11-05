import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DateRange } from "react-date-range";
import {
  differenceInDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfToday,
  max as maxDate,
} from "date-fns";
import { ShieldCheck, Heart, Truck, RotateCcw, CreditCard, CircleCheck } from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import API from "../utils/api";
import { thumb, cardImage, photoSrcSet, PLACEHOLDER_IMAGE } from "../utils/image";
import { categoryLabel } from "../utils/catalog";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishListContext";
import ProductCard from "../components/explore/ProductCard";
import { money } from "../utils/format";
import OfferBox from "../components/product/OfferBox";
import usePageTitle from "../hooks/usePageTitle";
import { RatingBadge, Stars } from "../components/ui/Stars";

const PriceOption = ({ active, disabled, onClick, label, price, unit }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-start gap-1 px-4 py-3.5 rounded-lg text-left transition ${active ? "border-2 border-brand bg-cream" : "border border-[#d9cbb9] bg-white m-px hover:border-brand"} disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-[#d9cbb9]`}
  >
    <span className="text-[13px] font-semibold">{label}</span>
    {disabled ? (
      <span className="text-sm text-muted">Not offered</span>
    ) : (
      <span className="text-[22px] font-bold leading-none">
        {money(price)}
        {unit && <span className="text-[13px] font-medium">{unit}</span>}
      </span>
    )}
  </button>
);

const Fact = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted">{label}</span>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, authHeader } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [mode, setMode] = useState("rent");
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState("");
  const [offer, setOffer] = useState(null);
  usePageTitle(product?.title);
  const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: "selection" }]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setAdded("");
    setOffer(null);

    // The buyer's open offer on this item, if any
    if (user) {
      axios
        .get(`${API}/offers/for/${id}`, authHeader)
        .then(({ data }) => !ignore && setOffer(data))
        .catch(() => {});
    }

    axios
      // Logged in: sellers and admins can also open listings that aren't live yet
      .get(`${API}/products/${id}`, user ? authHeader : undefined)
      .then(({ data }) => {
        if (ignore) return;
        setProduct(data);
        // Start on an option this listing actually offers
        setMode(data.mode === "sell" || data.mode === "sale" ? "sale" : "rent");
        setActiveImage(data.images?.[0] || "");

        axios
          .get(`${API}/products`, { params: { mode: "all", categories: data.category, limit: 6 } })
          .then(({ data: s }) => !ignore && setSimilar((s.items || []).filter((p) => p._id !== data._id).slice(0, 5)))
          .catch(() => {});
      })
      .catch(() => !ignore && setProduct(null))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-2 gap-10">
        <div className="aspect-[4/5] rounded-sm bg-white border border-line animate-pulse" />
        <div className="h-[520px] rounded-sm bg-white border border-line animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">This item isn't available</h1>
        <p className="mt-2 text-sm text-muted">It may have been removed by the seller.</p>
        <Link to="/explore" className="btn btn-dark mt-6">
          Keep shopping
        </Link>
      </div>
    );
  }

  // RENTAL MATHS
  const start = dateRange[0].startDate;
  const end = dateRange[0].endDate;
  const days = Math.max(differenceInDays(end, start) + 1, 1);
  const rentPerDay = product.rent || 0;
  const totalRent = rentPerDay * days;
  // An accepted offer replaces the listed price for this buyer
  const offerPrice = offer?.status === "accepted" ? offer.amount : null;
  const salePrice = offerPrice ?? product.price;
  const totalPrice = mode === "rent" ? totalRent : salePrice;

  const canBuy = ["sell", "sale", "both"].includes(product.mode) && product.price > 0;
  const canRent = ["rent", "both"].includes(product.mode) && product.rent > 0;

  const day = (d) => format(d, "yyyy-MM-dd");

  // Days other people have already rented this item
  const bookings = product.bookings || [];
  const bookedDays = bookings.flatMap((b) => eachDayOfInterval({ start: parseISO(b.start), end: parseISO(b.end) }));
  const clashes = bookings.some((b) => day(start) <= b.end && day(end) >= b.start);

  // The seller's availability window (only if they picked a real range)
  const windowStart = product.availability?.startDate ? parseISO(product.availability.startDate.slice(0, 10)) : null;
  const windowEnd = product.availability?.endDate ? parseISO(product.availability.endDate.slice(0, 10)) : null;
  const hasWindow = windowStart && windowEnd && differenceInDays(windowEnd, windowStart) >= 1;

  const isMine = user && product.user === user._id;

  // Why this can't be ordered right now (empty = it can)
  const blockedReason =
    product.status === "sold" ? "This item has been sold"
      : product.status === "pending" ? "This listing is waiting for admin approval. Only you and admins can see it."
        : product.status === "rejected" ? `This listing was rejected by an admin${product.review?.rejectReason ? `: ${product.review.rejectReason}` : "."}`
          : product.status === "paused" ? "This listing is paused and hidden from buyers."
            : mode === "sale" && !canBuy ? "This item is only available to rent"
              : mode === "rent" && !canRent ? "This item is only available to buy"
                : mode === "rent" && clashes ? "Someone has already booked some of these dates. Please pick other days."
                  : "";

  const approved = ["live", "available", "sold"].includes(product.status);

  // The server recalculates the price from these fields
  const cartLine = {
    ...product,
    mode,
    total: totalPrice,
    ...(mode === "rent" && { rentStart: day(start), rentEnd: day(end) }),
    ...(mode === "sale" && offerPrice && { offerId: offer._id }),
  };

  const saved = wishlist.some((p) => p._id === product._id);
  const images = product.images?.length ? product.images : [""];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex flex-wrap gap-1.5">
        <Link to="/" className="text-brand hover:underline">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/explore?category=${product.category}`} className="text-brand hover:underline">
          {categoryLabel(product.category)}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate max-w-[60vw]">{product.title}</span>
      </nav>

      <section className="-mt-5 grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
        {/* GALLERY */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 lg:sticky lg:top-32">
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  aria-label={`Photo ${i + 1}`}
                  aria-pressed={activeImage === img}
                  className={`flex-shrink-0 w-[68px] h-[85px] rounded-md overflow-hidden bg-cream ${activeImage === img ? "ring-2 ring-brand" : "border border-line"}`}
                >
                  <img src={cardImage(img, 140)} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 aspect-[4/5] rounded-lg overflow-hidden bg-cream border border-line">
            <img src={thumb(activeImage, 900) || PLACEHOLDER_IMAGE} srcSet={photoSrcSet(activeImage, 900)} alt={product.title} className="w-full h-full object-contain" />
          </div>
        </div>

        {/* BUY BOX */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            {product.seller && (
              <span className="flex items-center gap-2">
                <Link to={`/seller/${product.seller._id}`} className="text-sm font-semibold text-brand hover:underline">
                  {product.seller.name}
                </Link>
                <RatingBadge rating={product.seller.rating} />
              </span>
            )}
            <h1 className="text-2xl sm:text-[28px] leading-tight font-semibold">{product.title}</h1>
            {approved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#3f6b4a]">
                <ShieldCheck size={16} />
                Photos and details reviewed by the ReWear team
              </span>
            )}
          </div>

          <div role="tablist" aria-label="Rent or buy" className="grid grid-cols-2 gap-2.5">
            <PriceOption label="Rent" price={product.rent} unit="/day" active={mode === "rent"} disabled={!canRent} onClick={() => setMode("rent")} />
            <PriceOption label={offerPrice ? "Buy at your offer" : "Buy"} price={salePrice} active={mode === "sale"} disabled={!canBuy} onClick={() => setMode("sale")} />
          </div>

          <div className="flex flex-wrap gap-6">
            <Fact label="Size" value={product.size} />
            <Fact label="Condition" value={product.condition || "Good"} />
            <Fact label="Category" value={categoryLabel(product.category)} />
          </div>

          {mode === "rent" && canRent && (
            <div className="bg-white border border-line rounded-sm overflow-hidden">
              <p className="px-4 pt-3.5 text-sm font-semibold">Pick your dates</p>
              <div className="flex justify-center rewear-calendar">
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  minDate={hasWindow ? maxDate([startOfToday(), windowStart]) : startOfToday()}
                  maxDate={hasWindow ? windowEnd : undefined}
                  disabledDates={bookedDays}
                  rangeColors={["#6b4430"]}
                  showDateDisplay={false}
                />
              </div>
              <div className="mx-4 py-3 border-t border-[#efe6da] flex justify-between text-sm">
                <span className="text-muted">
                  {format(start, "d MMM")} – {format(end, "d MMM")} · {days} day{days > 1 ? "s" : ""} × {money(rentPerDay)}
                </span>
                <span className="font-bold">{money(totalRent)}</span>
              </div>
              {bookings.length > 0 && (
                <p className="px-4 pb-3 text-xs text-muted">Greyed-out days are already booked by someone else.</p>
              )}
            </div>
          )}

          {mode === "sale" && canBuy && (
            <div className="bg-white border border-line rounded-sm p-4">
              <p className="text-sm font-semibold">One of a kind</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                There is only one of this piece. Once someone buys it, it comes off the site.
              </p>
            </div>
          )}

          {mode === "sale" && canBuy && !isMine && ["live", "available"].includes(product.status) && (
            <OfferBox product={product} offer={offer} setOffer={setOffer} />
          )}

          {blockedReason && (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">{blockedReason}</p>
          )}

          {isMine ? (
            <Link
              to={`/sell/${product._id}`}
              className="btn btn-dark h-12 w-full"
            >
              Edit your listing
            </Link>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={!!blockedReason}
                  onClick={() => setAdded(addToCart(cartLine) === "updated" ? "Your bag has been updated" : "Added to your bag")}
                  className="btn btn-dark h-12 flex-1 px-4"
                >
                  {mode === "rent" ? `Add rental to bag · ${money(totalRent)}` : `Add to bag · ${money(salePrice)}`}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={saved}
                  className="w-12 h-12 rounded-full border-2 border-line bg-white flex items-center justify-center hover:border-ink"
                >
                  <Heart size={20} className={saved ? "fill-brand text-brand" : ""} />
                </button>
              </div>
              <button
                type="button"
                disabled={!!blockedReason}
                onClick={() => navigate("/checkout", { state: { items: [cartLine] } })}
                className="btn btn-outline h-12 bg-white"
              >
                {mode === "rent" ? "Rent now" : "Buy now"}
              </button>
              {added && (
                <p role="status" className="flex items-center gap-2 text-sm text-[#3f6b4a]">
                  <CircleCheck size={16} />
                  {added} ·
                  <Link to="/cart" className="font-semibold text-brand hover:underline">View bag</Link>
                </p>
              )}
            </div>
          )}

          <ul className="border-t border-line pt-4 flex flex-col gap-3 text-sm leading-relaxed">
            <li className="flex gap-3">
              <Truck size={19} className="text-brand flex-shrink-0 mt-0.5" />
              <span>Shipped by the seller with a courier tracking number you can follow from <strong>My orders</strong>.</span>
            </li>
            <li className="flex gap-3">
              <RotateCcw size={19} className="text-brand flex-shrink-0 mt-0.5" />
              <span>Rentals: return by the end date. The order completes once the seller confirms it's back.</span>
            </li>
            <li className="flex gap-3">
              <CreditCard size={19} className="text-brand flex-shrink-0 mt-0.5" />
              <span>Pay by UPI, card or cash on delivery.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* DETAILS + SELLER */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
        <div className="bg-white border border-line rounded-sm p-6">
          <h2 className="text-lg font-bold">Product details</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4a3a2e] whitespace-pre-line">
            {product.description || "The seller hasn't added a description. Check the photos, size and condition before ordering."}
          </p>
          <dl className="mt-5 grid grid-cols-[130px_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted">Category</dt>
            <dd>{categoryLabel(product.category)}</dd>
            <dt className="text-muted">Size</dt>
            <dd>{product.size}</dd>
            <dt className="text-muted">Condition</dt>
            <dd>{product.condition || "Good"}</dd>
            <dt className="text-muted">Available as</dt>
            <dd>{[canBuy && "Sale", canRent && "Rental"].filter(Boolean).join(" and ") || "—"}</dd>
            {product.createdAt && (
              <>
                <dt className="text-muted">Listed</dt>
                <dd>{format(new Date(product.createdAt), "d MMM yyyy")}</dd>
              </>
            )}
          </dl>
        </div>

        {product.seller && (
          <div className="bg-white border border-line rounded-sm p-6 flex flex-col gap-3">
            <h2 className="text-lg font-bold">About the seller</h2>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="w-11 h-11 rounded-full bg-[#f1e6d8] text-brand font-bold flex items-center justify-center">
                {product.seller.name?.[0]?.toUpperCase() || "R"}
              </span>
              <div>
                <p className="font-semibold">{product.seller.name}</p>
                {product.seller.rating?.count > 0 && (
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    <Stars value={product.seller.rating.avg} size={13} />
                    {product.seller.rating.avg.toFixed(1)} from {product.seller.rating.count} review{product.seller.rating.count > 1 ? "s" : ""}
                  </p>
                )}
                {product.seller.since && (
                  <p className="text-[13px] text-muted">On ReWear since {format(new Date(product.seller.since), "MMMM yyyy")}</p>
                )}
              </div>
            </div>
            <Link to={`/seller/${product.seller._id}`} className="text-sm font-semibold text-brand hover:underline">
              Visit the seller's shop
            </Link>
          </div>
        )}
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="similar-h">
          <h2 id="similar-h" className="text-[22px] font-bold tracking-tight mb-4">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {similar.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
