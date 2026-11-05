import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import API from "../utils/api";
import { CATEGORIES } from "../utils/catalog";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/explore/ProductCard";

const getProducts = (params) =>
  axios.get(`${API}/products`, { params }).then(({ data }) => data.items || []).catch(() => []);

const STEPS = [
  { title: "Seller lists it", text: "Photos, size, condition and a sale or rental price." },
  { title: "ReWear reviews it", text: "Our team checks the photos and details before the listing goes live." },
  { title: "You order", text: "Buy it, or pick rental dates. The seller accepts the order." },
  { title: "Shipped with tracking", text: "Track it to your door, then confirm it arrived as described." },
];

const SectionHead = ({ id, title, to, linkText }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
    <h2 id={id} className="text-2xl font-bold tracking-tight">
      {title}
    </h2>
    {to && (
      <Link to={to} className="text-sm font-semibold text-brand hover:text-brand-dark">
        {linkText}
      </Link>
    )}
  </div>
);

const CardRowSkeleton = ({ count }) =>
  [...Array(count)].map((_, i) => <div key={i} className="aspect-[3/5] rounded-lg bg-white border border-line animate-pulse" />);

const Landing = () => {
  const { user } = useAuth();
  const [fresh, setFresh] = useState(null);
  const [rentals, setRentals] = useState(null);
  const [covers, setCovers] = useState({});

  useEffect(() => {
    getProducts({ mode: "all", limit: 10 }).then(setFresh);
    getProducts({ mode: "rent", limit: 5 }).then(setRentals);

    // One recent photo per occasion for the category tiles
    CATEGORIES.forEach(({ value }) =>
      getProducts({ mode: "all", categories: value, limit: 1 }).then(([p]) =>
        setCovers((c) => ({ ...c, [value]: p?.images?.[0] || null }))
      )
    );
  }, []);

  const heroImage = covers.wedding;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-12">
      {/* FEATURED */}
      <section aria-label="Featured" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-ink overflow-hidden grid sm:grid-cols-2 min-h-[380px]">
          <div className="p-8 sm:p-10 flex flex-col justify-center gap-4 text-paper">
            <span className="text-xs font-semibold tracking-[0.08em] uppercase text-[#e8c39e]">Wedding season</span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Rent the lehenga.
              <br />
              Keep the memories.
            </h1>
            <p className="text-[15px] leading-relaxed text-[#e3d5c4] max-w-sm">
              Bridal and festive wear from real wardrobes, for the days you need it. Pick your dates, wear it, send it back.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-1">
              <Link
                to="/explore?category=wedding"
                className="inline-flex items-center h-11 px-5 rounded-md bg-paper text-ink text-sm font-semibold hover:bg-white"
              >
                Shop wedding wear
              </Link>
              <Link
                to="/explore?mode=rent"
                className="inline-flex items-center h-11 px-5 rounded-md border border-[#8a7462] text-paper text-sm font-semibold hover:bg-white/10"
              >
                See rentals
              </Link>
            </div>
          </div>
          <div className="bg-[#d8bfa6] min-h-[240px]">
            {heroImage && (
              <img src={thumb(heroImage, 800)} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-line p-7 flex flex-col justify-center gap-3">
          <span className="text-xs font-semibold tracking-[0.08em] uppercase text-[#8a5a2b]">Sell on ReWear</span>
          <h2 className="text-2xl font-bold leading-snug tracking-tight">Your wardrobe can pay for your next outfit</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            List in a few minutes. Set a sale price, a rental price per day, or both, and change it whenever you like.
          </p>
          <Link
            to={user ? "/sell" : "/login"}
            className="self-start mt-1 inline-flex items-center h-11 px-5 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-dark"
          >
            Start selling
          </Link>
        </div>
      </section>

      {/* OCCASIONS */}
      <section aria-labelledby="cat-h">
        <SectionHead id="cat-h" title="Shop by occasion" to="/explore" linkText="View all" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map(({ value, label }) => (
            <Link key={value} to={`/explore?category=${value}`} className="group flex flex-col gap-2 text-ink">
              <div className="aspect-[4/5] rounded-lg bg-cream overflow-hidden">
                <img
                  src={thumb(covers[value], 400) || PLACEHOLDER_IMAGE}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <span className="text-sm sm:text-[15px] font-semibold group-hover:text-brand">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW AN ORDER WORKS */}
      <section aria-labelledby="how-h" className="rounded-xl bg-white border border-line p-6 sm:p-8">
        <h2 id="how-h" className="text-2xl font-bold tracking-tight mb-6">
          How an order works
        </h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3.5">
              <span className="flex-none w-9 h-9 rounded-full bg-[#f1e6d8] text-brand font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FRESH */}
      <section aria-labelledby="new-h">
        <SectionHead id="new-h" title="Fresh on ReWear" to="/explore" linkText="See everything" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {fresh ? fresh.map((p) => <ProductCard key={p._id} product={p} />) : <CardRowSkeleton count={10} />}
        </div>
        {fresh?.length === 0 && <p className="text-sm text-muted">No listings yet. Be the first to sell something.</p>}
      </section>

      {/* RENTALS */}
      {rentals?.length > 0 && (
        <section aria-labelledby="rent-h">
          <SectionHead id="rent-h" title="Rent for your next event" to="/explore?mode=rent" linkText="All rentals" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {rentals.map((p) => (
              <ProductCard key={p._id} product={p} prefer="rent" />
            ))}
          </div>
        </section>
      )}

      {/* RENT VS BUY */}
      <section aria-label="Renting and buying" className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#efe3d1] p-7 flex flex-col gap-2.5">
          <h2 className="text-xl font-bold">Renting</h2>
          <p className="text-[15px] leading-relaxed text-[#4a3a2e]">
            Choose your dates on the calendar. Booked days are blocked, so nobody else can take your outfit. Return it after the event and the seller confirms it's back.
          </p>
          <Link to="/explore?mode=rent" className="mt-1 text-sm font-semibold text-brand hover:text-brand-dark">
            Browse rentals
          </Link>
        </div>
        <div className="rounded-xl bg-[#e4ddd1] p-7 flex flex-col gap-2.5">
          <h2 className="text-xl font-bold">Buying</h2>
          <p className="text-[15px] leading-relaxed text-[#4a3a2e]">
            Each piece is one of a kind. The seller ships with a courier and tracking number, and you confirm when it arrives as described.
          </p>
          <Link to="/explore?mode=sale" className="mt-1 text-sm font-semibold text-brand hover:text-brand-dark">
            Shop pre-loved
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
