import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, CalendarDays, HandCoins, Truck } from "lucide-react";

import API from "../utils/api";
import { CATEGORIES } from "../utils/catalog";
import { thumb, cardImage, cardSrcSet, photoSrcSet, PLACEHOLDER_IMAGE } from "../utils/image";
import ProductCard from "../components/explore/ProductCard";
import RecentlyViewed from "../components/explore/RecentlyViewed";
import usePageTitle from "../hooks/usePageTitle";

// Real features, shown as the dark strip under the hero
const PERKS = [
  { icon: ShieldCheck, title: "Checked by our team", text: "Every listing reviewed", to: "/howitworks" },
  { icon: CalendarDays, title: "Rent by the day", text: "Pick your dates", to: "/explore?mode=rent" },
  { icon: HandCoins, title: "Make an offer", text: "Haggle on items for sale", to: "/explore?mode=sale" },
  { icon: Truck, title: "Tracked delivery", text: "Courier and tracking number", to: "/howitworks" },
];

const Container = ({ className = "", children }) => <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${className}`}>{children}</div>;

// Centred, capitalised section heading with an optional coloured kicker above it
const Heading = ({ id, kicker, kickerColor, children }) => (
  <div className="text-center mb-6">
    {kicker && (
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: kickerColor || "#6e5d50" }}>
        {kicker}
      </p>
    )}
    <h2 id={id} className="mt-1 text-[26px] sm:text-3xl font-bold uppercase tracking-[0.06em]">
      {children}
    </h2>
  </div>
);

const CardRowSkeleton = ({ count }) =>
  [...Array(count)].map((_, i) => <div key={i} className="aspect-[3/5] bg-white animate-pulse" />);

// One occasion: heading, a swipeable row of its newest pieces and a "shop all" button
const CategoryRow = ({ info, data, shaded }) => (
  <section aria-labelledby={`row-${info.value}`} className={`py-12 ${shaded ? "bg-sand" : ""}`}>
    <Container>
      <Heading id={`row-${info.value}`} kicker={`${info.label} · ${data.count} pieces`} kickerColor={info.color}>
        {info.title}
      </Heading>
      <div className="scroll-row flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mr-4 pr-4 sm:mr-0 sm:pr-0">
        {data.items.map((p) => (
          <div key={p._id} className="snap-start flex-shrink-0 w-[170px] sm:w-[210px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <Link to={`/explore?category=${info.value}`} className="btn btn-outline">
          Shop {info.label}
        </Link>
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
  const heroLeft = categories.wedding?.cover;
  const heroRight = categories.party?.cover || categories.designer?.cover;
  const rows = CATEGORIES.filter((c) => categories[c.value]?.items?.length >= 2);

  return (
    <div className="flex flex-col">
      {/* HERO: two photos edge to edge with the message over them */}
      <section aria-label="Featured" className="relative bg-ink">
        <div className="grid grid-cols-1 sm:grid-cols-2 h-[460px] sm:h-[560px]">
          {[heroLeft, heroRight].map((src, i) => (
            <div key={i} className={`bg-night overflow-hidden ${i === 1 ? "hidden sm:block" : ""}`}>
              {/* The first photo is the largest thing on screen, so it loads first */}
              {src && <img src={thumb(src, 900)} srcSet={photoSrcSet(src, 900)} alt="" fetchPriority={i === 0 ? "high" : "auto"} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-center px-6">
          <p className="enter font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-gold">Pre-loved Indian fashion</p>
          <h1 className="enter enter-2 mt-3 text-white text-5xl sm:text-7xl font-extrabold uppercase tracking-[0.04em] leading-none">
            Wear it again
          </h1>
          <p className="enter enter-3 mt-4 max-w-md text-white/90 text-[15px] sm:text-base">
            Lehengas, sherwanis, sarees and streetwear from real wardrobes. Buy to keep, or rent for your dates.
          </p>
          <div className="enter enter-3 mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/explore?mode=sale" className="btn btn-light min-w-[150px]">
              Shop to buy
            </Link>
            <Link to="/explore?mode=rent" className="btn btn-light min-w-[150px]">
              Shop to rent
            </Link>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <Container className="mt-4">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PERKS.map(({ icon: Icon, title, text, to }) => (
            <li key={title}>
              <Link to={to} className="h-full bg-ink text-paper flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center hover:bg-brand transition-colors">
                <Icon size={22} className="text-gold" />
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">{title}</span>
                <span className="text-xs text-paper/75">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* OCCASIONS */}
      <section aria-labelledby="cat-h" className="py-12">
        <Container>
          <Heading id="cat-h" kicker="Sorted by what you'd wear it to">
            Shop by occasion
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((c) => {
              const data = categories[c.value];
              return (
                <Link key={c.value} to={`/explore?category=${c.value}`} className="group relative block aspect-[3/4] overflow-hidden bg-cream">
                  <img
                    src={cardImage(data?.cover, 320) || PLACEHOLDER_IMAGE}
                    srcSet={cardSrcSet(data?.cover, 320)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                  <span className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <span className="block font-display text-lg font-bold uppercase tracking-[0.08em]">{c.label}</span>
                    <span className="mt-1 block h-[3px] w-8" style={{ backgroundColor: c.color }} aria-hidden="true" />
                    {data && <span className="mt-1.5 block text-xs text-white/80">{data.count} pieces</span>}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center">
            <Link to="/explore" className="btn btn-outline">
              Shop all occasions
            </Link>
          </div>
        </Container>
      </section>

      {/* NEW IN */}
      <section aria-labelledby="new-h" className="pb-12">
        <Container>
          <Heading id="new-h" kicker="Just approved">
            New in
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-4">
            {home ? home.fresh.map((p) => <ProductCard key={p._id} product={p} />) : <CardRowSkeleton count={10} />}
          </div>
          {home?.fresh.length === 0 && <p className="text-center text-sm text-muted">No listings yet. Be the first to sell something.</p>}
          <div className="mt-8 flex justify-center">
            <Link to="/explore" className="btn btn-dark">
              View everything
            </Link>
          </div>
        </Container>
      </section>

      {/* PICK UP WHERE YOU LEFT OFF (only shown once something has been viewed) */}
      <Container className="pb-12 empty:hidden">
        <RecentlyViewed centered />
      </Container>

      {/* ONE ROW PER OCCASION */}
      {rows.map((c, i) => (
        <CategoryRow key={c.value} info={c} data={categories[c.value]} shaded={i % 2 === 0} />
      ))}

      {/* RENTALS */}
      {home?.rentals.length > 0 && (
        <section aria-labelledby="rent-h" className="py-12">
          <Container>
            <Heading id="rent-h" kicker="Booked days are blocked for everyone else">
              Rent for your next event
            </Heading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-4">
              {home.rentals.map((p) => (
                <ProductCard key={p._id} product={p} prefer="rent" />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* SELL BANNER */}
      <section aria-labelledby="sell-h" className="bg-ink text-paper">
        <Container className="py-14 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">Sell on ReWear</p>
            <h2 id="sell-h" className="mt-2 text-3xl sm:text-4xl font-bold uppercase tracking-[0.04em]">
              Your wardrobe can pay for your next outfit
            </h2>
            <p className="mt-3 max-w-xl text-paper/80">
              List in a few minutes. Set a sale price, a rental price per day, or both. Our team checks it, buyers find it.
            </p>
          </div>
          <Link to="/sell" className="btn btn-light self-start md:self-center">
            Start selling
          </Link>
        </Container>
      </section>
    </div>
  );
};

export default Landing;
