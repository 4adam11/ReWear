import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { HandCoins } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../utils/format";

// "Make an offer" on an item for sale, and the state of the buyer's current offer
const OfferBox = ({ product, offer, setOffer }) => {
  const { user, authHeader } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const min = Math.ceil(product.price * 0.5);

  const call = async (fn) => {
    setBusy(true);
    setError("");
    try {
      setOffer((await fn()).data);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const send = (e) => {
    e.preventDefault();
    call(() => axios.post(`${API}/offers`, { productId: product._id, amount: Number(amount) }, authHeader));
  };

  const respond = (action) => call(() => axios.patch(`${API}/offers/${offer._id}/${action}`, {}, authHeader));

  const box = "rounded-lg border border-line bg-white p-4 text-sm";

  if (offer?.status === "accepted") {
    return (
      <div className={`${box} border-[#bcd3c0] bg-[#f3f8f3]`}>
        <p className="font-semibold text-[#2f5a3a]">Your offer of {money(offer.amount)} was accepted</p>
        <p className="mt-1 text-[13px] text-[#3f6b4a]">
          The bag and checkout use this price. It's yours for {formatDistanceToNowStrict(new Date(offer.expiresAt))} more.
        </p>
      </div>
    );
  }

  if (offer?.status === "pending") {
    return (
      <div className={box}>
        <p className="font-semibold">You offered {money(offer.amount)}</p>
        <p className="mt-1 text-[13px] text-muted">Waiting for the seller to reply. We'll send you an alert.</p>
        {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
        <button type="button" disabled={busy} onClick={() => respond("withdraw")} className="mt-2 text-[13px] font-semibold text-brand hover:underline">
          Withdraw offer
        </button>
      </div>
    );
  }

  if (offer?.status === "countered") {
    return (
      <div className={box}>
        <p className="font-semibold">The seller countered with {money(offer.counterAmount)}</p>
        <p className="mt-1 text-[13px] text-muted">You offered {money(offer.amount)}.</p>
        {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy} onClick={() => respond("accept")} className="h-9 px-4 rounded-md bg-brand text-white text-[13px] font-semibold hover:bg-brand-dark">
            Accept {money(offer.counterAmount)}
          </button>
          <button type="button" disabled={busy} onClick={() => respond("reject")} className="h-9 px-4 rounded-md border border-line text-[13px] font-semibold hover:border-brand">
            Decline
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand hover:underline"
      >
        <HandCoins size={17} />
        Make an offer
      </button>
    );
  }

  if (!user) {
    return (
      <p className={box}>
        <Link to="/login" state={{ from: `/product/${product._id}` }} className="font-semibold text-brand hover:underline">
          Log in
        </Link>{" "}
        to make an offer.
      </p>
    );
  }

  return (
    <form onSubmit={send} className={box}>
      <label htmlFor="offer-amount" className="font-semibold">
        Your offer
      </label>
      <p className="text-[13px] text-muted">
        Listed at {money(product.price)}. Offers from {money(min)}. If the seller accepts, you have 48 hours to buy at your price.
      </p>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
          <input
            id="offer-amount"
            type="number"
            inputMode="numeric"
            min={min}
            max={product.price - 1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 w-full pl-7 pr-3 rounded-md border border-[#d9cbb9] focus:outline-none focus:border-brand"
          />
        </div>
        <button type="submit" disabled={busy || !amount} className="h-10 px-4 rounded-md bg-brand text-white text-[13px] font-semibold hover:bg-brand-dark disabled:opacity-50">
          Send offer
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 px-3 text-[13px] font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </form>
  );
};

export default OfferBox;
