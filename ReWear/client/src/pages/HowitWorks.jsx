import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

const BUYING = [
  { title: "Find an outfit", text: "Browse by occasion, size and price. Every listing has been reviewed by the ReWear team." },
  { title: "Buy it or pick rental dates", text: "Days someone else has booked are blocked on the calendar, so your dates are yours." },
  { title: "Seller accepts and ships", text: "You get a notification at each step, plus the courier name and tracking number." },
  { title: "Confirm delivery", text: "Mark it received. For a purchase, confirm it's as described to complete the order." },
  { title: "Rentals: send it back", text: "Return it by the end date. The order completes once the seller confirms it's back." },
];

const SELLING = [
  { title: "List your item", text: "Add photos, size, condition, and a sale price, a rental price per day, or both." },
  { title: "Photo check", text: "An automatic check blocks explicit images and flags photos that may not show clothing." },
  { title: "Admin review", text: "A ReWear admin approves or rejects the listing, with a reason you can see and fix." },
  { title: "Fulfil orders", text: "Accept the order, ship it with tracking, and confirm rental returns from Orders to fulfil." },
  { title: "Change prices any time", text: "Price changes go live straight away. New photos or details go back for review." },
];

const Steps = ({ title, steps }) => (
  <section className="bg-white border border-line rounded-sm p-6 sm:p-8">
    <h2 className="text-xl font-bold mb-5">{title}</h2>
    <ol className="flex flex-col gap-5">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3.5">
          <span className="flex-none w-8 h-8 rounded-full bg-[#f1e6d8] text-brand text-sm font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold">{s.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const HowItWorks = () => {
  usePageTitle("How it works");
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="page-title">How ReWear works</h1>
        <p className="mt-2 text-[15px] text-muted max-w-2xl">
          ReWear is a marketplace for pre-loved Indian fashion. You can buy a piece to keep, or rent it for an event and send it back.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Steps title="Buying and renting" steps={BUYING} />
        <Steps title="Selling" steps={SELLING} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/explore" className="btn btn-dark">
          Start shopping
        </Link>
        <Link
          to="/sell"
          className="btn btn-outline"
        >
          List an item
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks;
