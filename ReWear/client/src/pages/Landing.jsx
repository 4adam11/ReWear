import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

import API from "../utils/api";
import { CATEGORIES, categoryInfo } from "../utils/catalog";
import { thumb, cardImage, cardSrcSet, photoSrcSet, PLACEHOLDER_IMAGE } from "../utils/image";
import ProductCard from "../components/explore/ProductCard";
import usePageTitle from "../hooks/usePageTitle";

const STEPS = [
  { title: "Seller lists it", text: "Photos, size, condition and a sale or rental price." },
  { title: "ReWear reviews it", text: "Our team checks the photos and details before the listing goes live." },
  { title: "You order", text: "Buy it, or pick rental dates. The seller accepts the order." },
  { title: "Shipped with tracking", text: "Track it to your door, then confirm it arrived as described." },
];

const WEDDING = categoryInfo("wedding");

const Container = ({ className = "", children }) => <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${className}`}>{children}</div>;

const SectionHead = ({ id, title, sub, to, linkText }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {to && (
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
        {linkText}
        <ArrowRight size={15} />
      </Link>
    )}
  </div>
);

const CardRowSkeleton = ({ count }) =>
  [...Array(count)].map((_, i) => <div key={i} className="aspect-[3/5] rounded-lg bg-white border border-line animate-pulse" />);

// One occasion: a coloured panel on the left and its newest items scrolling on the right
const CategoryRow = ({ info, data, shaded }) => (
  <section aria-labelledby={`row-${info.value}`} className={shaded ? "bg-sand py-10" : "py-10"}>
    <Container className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] items-stretch">
      <div className="rounded-xl p-6 text-white flex flex-col justify-between gap-6" style={{ backgroundColor: info.color }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] uppercase text-white/75">{data.count} pieces</p>
          <h2 id={`row-${info.value}`} className="mt-1.5 text-2xl font-bold tracking-tight">
            {info.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">{info.tagline}</p>
        </div>
        <Link
          to={`/explore?category=${info.value}`}
          className="self-start inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-white text-sm font-semibold hover:bg-paper"
          style={{ color: info.color }}
        >
          Shop {info.label.toLowerCase()}
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="scroll-row flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mr-4 pr-4 sm:mr-0 sm:pr-0">
        {data.items.map((p) => (
          <div key={p._id} className="snap-start flex-shrink-0 w-[170px] sm:w-[200px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </Container>
  </section>
);

const Landing = () => {
  usePageTitle();
  const [home, setHome] = useState(null);

  // Everything the home page shows, in one request
  useEffect(() => {
    axios
      .get(`${API}/products/home`)
      .then(({ data }) => setHome(data))
      .catch(() => setHome({ fresh: [], rentals: [], categories: {} }));
  }, []);

  const categories = home?.categories || {};
  const heroImage = categories.wedding?.cover;
  const rows = CATEGORIES.filter((c) => categories[c.value]?.items?.length >= 2);

  return (
    <div className="flex flex-col">
      <Container className="pt-6 flex flex-col gap-12">
        {/* FEATURED */}
        <section aria-label="Featured" className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl overflow-hidden grid sm:grid-cols-2 min-h-[380px]" style={{ backgroundColor: WEDDING.color }}>
            <div className="p-8 sm:p-10 flex flex-col justify-center gap-4 text-white">
              <span className="text-xs font-semibold tracking-[0.08em] uppercase text-[#f3c9a4]">Wedding season</span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight">
                Rent the lehenga.
                <br />
                Keep the memories.
              </h1>
              <p className="text-[15px] leading-relaxed text-white/85 max-w-sm">
                Bridal and festive wear from real wardrobes, for the days you need it. Pick your dates, wear it, send it back.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-1">
                <Link
                  to="/explore?category=wedding"
                  className="inline-flex items-center h-11 px-5 rounded-md bg-white text-sm font-semibold hover:bg-paper"
                  style={{ color: WEDDING.color }}
                >
                  Shop wedding wear
                </Link>
                <Link
                  to="/explore?mode=rent"
                  className="inline-flex items-center h-11 px-5 rounded-md border border-white/45 text-white text-sm font-semibold hover:bg-white/10"
                >
                  See rentals
                </Link>
              </div>
            </div>
            <div className="bg-[#5c1a25] min-h-[260px]">
              {heroImage && (
                <img src={thumb(heroImage, 700)} srcSet={photoSrcSet(heroImage, 700)} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-line shadow-card p-7 flex flex-col justify-center gap-3">
            <span className="text-xs font-semibold tracking-[0.08em] uppercase text-accent">Sell on ReWear</span>
            <h2 className="text-2xl font-bold leading-snug tracking-tight">Your wardrobe can pay for your next outfit</h2>
            <p className="text-[15px] leading-relaxed text-muted">
              List in a few minutes. Set a sale price, a rental price per day, or both, and change it whenever you like.
            </p>
            <Link
              to="/sell"
              className="self-start mt-1 inline-flex items-center h-11 px-5 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-dark"
            >
              Start selling
            </Link>
          </div>
        </section>

        {/* OCCASIONS */}
        <section aria-labelledby="cat-h">
          <SectionHead id="cat-h" title="Shop by occasion" sub="Every piece is sorted by what you'd wear it to." to="/explore" linkText="View all" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((c) => {
              const data = categories[c.value];
              return (
                <Link
                  key={c.value}
                  to={`/explore?category=${c.value}`}
                  className="group rounded-lg overflow-hidden bg-white border border-line shadow-card hover:shadow-lift hover:-translate-y-0.5 transition duration-200"
                >
                  <div className="aspect-[4/5] bg-cream overflow-hidden">
                    <img
                      src={cardImage(data?.cover, 300) || PLACEHOLDER_IMAGE}
                      srcSet={cardSrcSet(data?.cover, 300)}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                    />
                  </div>
                  <div className="px-3 py-2.5 text-white flex items-baseline justify-between gap-2" style={{ backgroundColor: c.color }}>
                    <span className="text-[15px] font-semibold">{c.label}</span>
                    <span className="text-xs text-white/80">{data ? `${data.count} items` : ""}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* HOW AN ORDER WORKS */}
        <section aria-labelledby="how-h" className="rounded-xl bg-white border border-line shadow-card p-6 sm:p-8">
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
          <SectionHead id="new-h" title="Fresh on ReWear" sub="Just listed and approved by our team." to="/explore" linkText="See everything" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {home ? home.fresh.map((p) => <ProductCard key={p._id} product={p} />) : <CardRowSkeleton count={10} />}
          </div>
          {home?.fresh.length === 0 && <p className="text-sm text-muted">No listings yet. Be the first to sell something.</p>}
        </section>
      </Container>

      {/* ONE ROW PER OCCASION, on alternating bands */}
      <div className="mt-6">
        {rows.map((c, i) => (
          <CategoryRow key={c.value} info={c} data={categories[c.value]} shaded={i % 2 === 0} />
        ))}
      </div>

      <Container className="pt-6 flex flex-col gap-12">
        {/* RENTALS */}
        {home?.rentals.length > 0 && (
          <section aria-labelledby="rent-h">
            <SectionHead id="rent-h" title="Rent for your next event" sub="Pick your dates; booked days are blocked for everyone else." to="/explore?mode=rent" linkText="All rentals" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {home.rentals.map((p) => (
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
      </Container>
    </div>
  );
};

export default Landing;
