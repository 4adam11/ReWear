import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Ruler,
  ShoppingBag,
  Truck,
  Star,
  CalendarDays,
  Shirt,
  RotateCcw,
  CircleCheck,
  Camera,
  ScanEye,
  ShieldCheck,
  MessageCircle,
  PackageCheck,
  ArrowRight,
  ChevronDown,
  TriangleAlert,
  HandCoins,
  Upload,
  Ban,
  Flag,
  UserCheck,
} from "lucide-react";

import API from "../utils/api";
import { cardImage, cardSrcSet } from "../utils/image";
import usePageTitle from "../hooks/usePageTitle";

// ---------------------------------------------------------------------------
// Content (every step describes something the site really does)
// ---------------------------------------------------------------------------

const JOURNEYS = {
  buy: {
    label: "I'm buying",
    intro: "Every piece is one of a kind. Find it, check it properly, and it's yours to keep.",
    cta: { to: "/explore?mode=sale", text: "Shop to buy" },
    steps: [
      { icon: Search, title: "Find it", text: "Search as you type, or browse by occasion, size, price and condition." },
      { icon: Ruler, title: "Check it", text: "Zoom into every photo, read the measurements and size guide, or ask the seller a question." },
      { icon: HandCoins, title: "Make an offer", text: "Offer a lower price if you like. An accepted offer is held for you for 48 hours." },
      { icon: ShoppingBag, title: "Order", text: "Check out with a saved address and pay on delivery. The seller is alerted straight away." },
      { icon: Truck, title: "Track it", text: "The seller accepts and ships with a courier and tracking number you can follow." },
      { icon: Star, title: "Confirm and rate", text: "Mark it received, confirm it's as described, then rate the seller." },
    ],
  },
  rent: {
    label: "I'm renting",
    intro: "Wear the lehenga for the wedding, not for the next ten years. Pay by the day and send it back.",
    cta: { to: "/explore?mode=rent", text: "Shop to rent" },
    steps: [
      { icon: CalendarDays, title: "Pick your dates", text: "Days someone else has booked are greyed out, so the dates you choose are yours." },
      { icon: ShoppingBag, title: "Book it", text: "The price is the daily rate times the number of days. Nobody else can book those days." },
      { icon: Truck, title: "Receive it", text: "The seller ships it with tracking before your event." },
      { icon: Shirt, title: "Wear it", text: "Enjoy the occasion. If anything is wrong on arrival, report it straight away." },
      { icon: RotateCcw, title: "Send it back", text: "Return it by the end date. The seller confirms it's back and the rental is complete." },
    ],
  },
  sell: {
    label: "I'm selling",
    intro: "Turn the outfits you've already worn into money, or rent them out again and again.",
    cta: { to: "/sell", text: "List an item" },
    steps: [
      { icon: Camera, title: "List it", text: "Add up to 6 photos, a price to sell, a price per day to rent, or both. The occasion is picked for you." },
      { icon: ScanEye, title: "Photo check", text: "Our AI checks each photo the moment you upload it." },
      { icon: UserCheck, title: "Team review", text: "A ReWear admin approves it, or tells you exactly what to change." },
      { icon: MessageCircle, title: "Answer buyers", text: "Reply to questions in Messages and accept, decline or counter offers." },
      { icon: PackageCheck, title: "Ship it", text: "Accept the order and add the courier and tracking number." },
      { icon: Star, title: "Get rated", text: "Buyers rate you after each order. Good ratings show on every listing." },
    ],
  },
};

const CHECKS = [
  { icon: Upload, title: "You upload", text: "Clothing photos, up to 6 per listing." },
  { icon: Ban, title: "AI blocks", text: "Explicit images are rejected before they are ever stored." },
  { icon: Flag, title: "AI flags", text: "Photos that may not show clothing get a note for the admin." },
  { icon: UserCheck, title: "A person decides", text: "An admin approves or rejects every listing, with a reason." },
  { icon: CircleCheck, title: "It goes live", text: "Only approved listings are ever shown to shoppers." },
];

const ORDER_STEPS = ["Confirmed", "Accepted", "Shipped", "Delivered", "Completed"];

const COMPARE = [
  ["You pay", "The listed price, once", "A price per day for your dates"],
  ["You keep it", "Yes", "Until the end date, then send it back"],
  ["Best for", "Pieces you'll wear again", "Weddings, sangeets, one-off events"],
  ["Haggling", "Make an offer below the price", "Not available on rentals"],
  ["Order ends when", "You confirm it's as described", "The seller confirms it's back"],
];

const FAQ = [
  ["How do I pay?", "Cash on delivery for now. UPI and card payments are coming soon."],
  ["Who checks the listings?", "Two checks. An AI model on our server blocks explicit photos and flags doubtful ones, then a ReWear admin approves or rejects every listing before shoppers can see it."],
  ["Can I cancel an order?", "Yes, any time before it ships. A cancelled purchase goes straight back on sale."],
  ["What if it arrives damaged or isn't as described?", "Use Report a problem on the order. The order is paused while a ReWear admin looks into it, and they can refund you."],
  ["How do offers work?", "Offer anything from half the price up to just below it. The seller can accept, decline or counter. An accepted price is held for you for 48 hours."],
  ["Will it fit?", "Many listings show the seller's own measurements. Open Size guide on any product to compare them with a size chart, or ask the seller in Messages."],
  ["Is delivery charged?", "No. Delivery is free on every order."],
  ["How do I start selling?", "Any account can sell. Click Sell, add your photos and prices, and submit it for review. You'll get an alert when it's approved."],
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const Kicker = ({ children, light }) => (
  <p className={`font-display text-xs font-semibold uppercase tracking-[0.2em] ${light ? "text-[#e8c39e]" : "text-accent"}`}>{children}</p>
);

const SectionTitle = ({ id, children, light }) => (
  <h2 id={id} className={`mt-2 text-[26px] sm:text-[34px] font-bold uppercase tracking-[0.04em] leading-tight ${light ? "text-paper" : "text-ink"}`}>
    {children}
  </h2>
);

const Container = ({ className = "", children }) => <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${className}`}>{children}</div>;

// One journey as a row of numbered steps joined by a line (a column on phones)
const Journey = ({ steps }) => (
  <ol className={`grid gap-y-8 gap-x-4 ${steps.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-6"} sm:grid-cols-2`}>
    {steps.map(({ icon: Icon, title, text }, i) => (
      <li key={title} className="relative flex lg:flex-col gap-4 lg:gap-3 lg:text-center lg:items-center">
        {/* the connecting line to the next step */}
        {i < steps.length - 1 && (
          <span aria-hidden="true" className="hidden lg:block absolute top-7 left-[calc(50%+36px)] right-[calc(-50%+36px)] h-px bg-[#d9cbb9]" />
        )}
        <span className="relative flex-none w-14 h-14 rounded-full bg-ink text-paper flex items-center justify-center">
          <Icon size={22} strokeWidth={1.8} />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#e8c39e] text-ink text-xs font-bold flex items-center justify-center">
            {i + 1}
          </span>
        </span>
        <div>
          <p className="font-display text-[15px] font-bold uppercase tracking-[0.06em]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
        </div>
      </li>
    ))}
  </ol>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const HowItWorks = () => {
  usePageTitle("How it works");
  const [tab, setTab] = useState("buy");
  const [photos, setPhotos] = useState([]);
  const journey = JOURNEYS[tab];

  // Three real listing photos for the banner
  useEffect(() => {
    axios
      .get(`${API}/products/home`)
      .then(({ data }) => {
        const c = data.categories || {};
        setPhotos([c.wedding?.cover, c.ethnic?.cover, c.streetwear?.cover || c.party?.cover].filter(Boolean));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section aria-labelledby="hiw-title" className="bg-ink text-paper">
        <Container className="py-14 sm:py-20 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <div>
            <Kicker light>How ReWear works</Kicker>
            <h1 id="hiw-title" className="mt-3 text-4xl sm:text-6xl font-extrabold uppercase tracking-[0.03em] leading-[0.95]">
              Pre-loved,
              <br />
              done properly
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-paper/80">
              Buy a piece to keep, rent it for the day you need it, or sell what's sitting in your wardrobe. Every listing is checked by a person before anyone sees it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/explore" className="btn btn-light">
                Start shopping
              </Link>
              <Link to="/sell" className="btn border-2 border-paper/60 text-paper hover:bg-paper hover:text-ink">
                List an item
              </Link>
            </div>
          </div>

          {photos.length === 3 && (
            <div className="hidden sm:grid grid-cols-3 gap-3" aria-hidden="true">
              {photos.map((src, i) => (
                <div key={src} className={`aspect-[3/4] overflow-hidden bg-[#3b2a1f] ${i === 1 ? "translate-y-8" : ""}`}>
                  <img src={cardImage(src, 260)} srcSet={cardSrcSet(src, 260)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Container>

        {/* THREE PROMISES */}
        <div className="border-t border-white/10">
          <Container className="grid sm:grid-cols-3">
            {[
              [ShieldCheck, "Checked by a person", "AI screens the photos, an admin approves every listing"],
              [CalendarDays, "Buy or rent by the day", "Booked dates are blocked so nobody can double-book"],
              [Truck, "Tracked to your door", "Courier and tracking number on every shipped order"],
            ].map(([Icon, title, text], i) => (
              <div key={title} className={`flex gap-3 py-6 ${i > 0 ? "sm:pl-6 sm:border-l border-white/10" : ""} ${i < 2 ? "border-b sm:border-b-0 border-white/10" : ""}`}>
                <Icon size={22} className="text-[#e8c39e] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.1em]">{title}</p>
                  <p className="mt-0.5 text-[13px] text-paper/70">{text}</p>
                </div>
              </div>
            ))}
          </Container>
        </div>
      </section>

      {/* STEP BY STEP, PER ROLE */}
      <section aria-labelledby="journey-h" className="py-16">
        <Container>
          <div className="text-center">
            <Kicker>Step by step</Kicker>
            <SectionTitle id="journey-h">Pick what you're here to do</SectionTitle>
          </div>

          <div role="tablist" aria-label="Choose a journey" className="mt-8 mx-auto w-full sm:w-fit grid grid-cols-3 sm:flex border-2 border-ink">
            {Object.entries(JOURNEYS).map(([key, j]) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls="journey-panel"
                onClick={() => setTab(key)}
                className={`px-1 sm:px-7 h-12 font-display text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.06em] sm:tracking-[0.1em] whitespace-nowrap transition-colors ${tab === key ? "bg-ink text-paper" : "bg-white text-ink hover:bg-cream"}`}
              >
                {j.label}
              </button>
            ))}
          </div>

          <div id="journey-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-10">
            <p className="text-center max-w-xl mx-auto text-[16px] text-muted">{journey.intro}</p>
            <div className="mt-10">
              <Journey key={tab} steps={journey.steps} />
            </div>
            <div className="mt-10 flex justify-center">
              <Link to={journey.cta.to} className="btn btn-dark">
                {journey.cta.text}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* TWO CHECKS */}
      <section aria-labelledby="checks-h" className="bg-sand py-16">
        <Container>
          <div className="max-w-2xl">
            <Kicker>Trust and safety</Kicker>
            <SectionTitle id="checks-h">Nothing goes live without two checks</SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              An AI model running on our own server looks at every photo the moment it's uploaded, so no outside service ever sees it. Then a ReWear admin makes the final call.
            </p>
          </div>

          <ol className="mt-10 grid gap-3 sm:grid-cols-5">
            {CHECKS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative bg-white border border-line p-5 flex sm:flex-col gap-3">
                <Icon size={24} className={i === CHECKS.length - 1 ? "text-[#3f6b4a]" : i === 1 ? "text-red-700" : "text-brand"} />
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.08em]">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{text}</p>
                </div>
                {i < CHECKS.length - 1 && (
                  <ArrowRight aria-hidden="true" size={18} className="hidden sm:block absolute -right-[15px] top-1/2 -translate-y-1/2 z-10 bg-sand text-muted" />
                )}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ORDER JOURNEY */}
      <section aria-labelledby="order-h" className="py-16">
        <Container>
          <div className="text-center">
            <Kicker>After you order</Kicker>
            <SectionTitle id="order-h">Every order, every step, in view</SectionTitle>
            <p className="mt-3 max-w-xl mx-auto text-[15px] text-muted">
              Both of you get an alert at each step, and the order page shows exactly where things are.
            </p>
          </div>

          <ol className="mt-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            {ORDER_STEPS.map((s, i) => (
              <li key={s} className="flex sm:flex-1 items-center gap-3 sm:flex-col sm:gap-2">
                <div className="flex items-center w-full gap-0">
                  <span aria-hidden="true" className={`hidden sm:block flex-1 h-0.5 ${i === 0 ? "bg-transparent" : "bg-ink"}`} />
                  <span className={`flex-none w-10 h-10 rounded-full flex items-center justify-center ${i === ORDER_STEPS.length - 1 ? "bg-[#3f6b4a] text-white" : "bg-ink text-paper"}`}>
                    <CircleCheck size={18} />
                  </span>
                  <span aria-hidden="true" className={`hidden sm:block flex-1 h-0.5 ${i === ORDER_STEPS.length - 1 ? "bg-transparent" : "bg-ink"}`} />
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-[0.08em]">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            <div className="border border-line bg-white p-5 flex gap-3">
              <RotateCcw size={22} className="text-brand flex-shrink-0" />
              <div>
                <p className="font-semibold">Changed your mind?</p>
                <p className="mt-1 text-sm text-muted">Cancel any time before it ships. A cancelled purchase goes straight back on sale.</p>
              </div>
            </div>
            <div className="border border-line bg-white p-5 flex gap-3">
              <TriangleAlert size={22} className="text-amber-700 flex-shrink-0" />
              <div>
                <p className="font-semibold">Something wrong?</p>
                <p className="mt-1 text-sm text-muted">Report a problem once it's shipped. The order pauses and an admin decides, including refunds.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* BUY OR RENT */}
      <section aria-labelledby="compare-h" className="bg-sand py-16">
        <Container className="max-w-4xl">
          <div className="text-center">
            <Kicker>Not sure which?</Kicker>
            <SectionTitle id="compare-h">Buy or rent</SectionTitle>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full bg-white border border-line text-[13px] sm:text-sm">
              <thead>
                <tr className="bg-ink text-paper">
                  <th scope="col" className="p-3 sm:p-4 text-left w-1/4"><span className="sr-only">Compare</span></th>
                  <th scope="col" className="p-3 sm:p-4 text-left font-display text-sm uppercase tracking-[0.1em]">Buy</th>
                  <th scope="col" className="p-3 sm:p-4 text-left font-display text-sm uppercase tracking-[0.1em]">Rent</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([row, buy, rent]) => (
                  <tr key={row} className="border-t border-line">
                    <th scope="row" className="p-3 sm:p-4 text-left font-semibold text-muted">{row}</th>
                    <td className="p-3 sm:p-4">{buy}</td>
                    <td className="p-3 sm:p-4">{rent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/explore?mode=sale" className="btn btn-dark">Shop to buy</Link>
            <Link to="/explore?mode=rent" className="btn btn-outline">Shop to rent</Link>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-h" className="py-16">
        <Container className="max-w-3xl">
          <div className="text-center">
            <Kicker>Questions</Kicker>
            <SectionTitle id="faq-h">Good to know</SectionTitle>
          </div>

          <div className="mt-8 border-t border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-b border-line">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none font-semibold hover:text-brand [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown size={18} className="flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 -mt-1 text-[15px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* CLOSING BAND */}
      <section aria-labelledby="cta-h" className="bg-ink text-paper">
        <Container className="py-14 text-center">
          <h2 id="cta-h" className="text-3xl sm:text-4xl font-extrabold uppercase tracking-[0.04em]">
            Your next outfit is already out there
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/explore" className="btn btn-light">Start shopping</Link>
            <Link to="/sell" className="btn border-2 border-paper/60 text-paper hover:bg-paper hover:text-ink">Start selling</Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HowItWorks;
