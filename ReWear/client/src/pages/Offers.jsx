import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import StatusBadge from "../components/ui/StatusBadge";
import { money } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";

const btn = "btn btn-sm";

const OfferRow = ({ offer, side, onChange }) => {
  const { authHeader } = useAuth();
  const [counter, setCounter] = useState("");
  const [countering, setCountering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = async (action, body = {}) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.patch(`${API}/offers/${offer._id}/${action}`, body, authHeader);
      onChange({ ...offer, ...data, buyer: offer.buyer, seller: offer.seller });
      setCountering(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const who = side === "received" ? offer.buyer?.name : offer.seller?.name;
  const status = offer.status;

  return (
    <li className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex gap-4">
        {/* Same destination as the title link, so it is skipped by keyboards and screen readers */}
        <Link to={`/product/${offer.product}`} tabIndex={-1} aria-hidden="true" className="flex-shrink-0">
          <img src={thumb(offer.image, 160) || PLACEHOLDER_IMAGE} alt="" className="w-14 h-[70px] rounded-sm object-cover bg-cream border border-line" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/product/${offer.product}`} className="text-sm font-semibold hover:text-brand truncate">
              {offer.title}
            </Link>
            <StatusBadge status={status === "pending" ? "open" : status} />
          </div>
          <p className="mt-1 text-[13px]">
            <span className="font-semibold">{money(offer.amount)}</span>
            <span className="text-muted"> offered on {money(offer.listPrice)}</span>
            {status === "countered" && (
              <span className="text-muted">
                {" "}· countered at <span className="font-semibold text-ink">{money(offer.counterAmount)}</span>
              </span>
            )}
          </p>
          <p className="text-xs text-muted">
            {side === "received" ? "From" : "To"} {who || "a ReWear user"} · {formatDistanceToNow(new Date(offer.updatedAt), { addSuffix: true })}
            {status === "accepted" && offer.expiresAt && ` · valid for ${formatDistanceToNowStrict(new Date(offer.expiresAt))} more`}
          </p>
        </div>
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      {side === "received" && status === "pending" && !countering && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => act("accept")} className="btn btn-dark btn-sm">
            Accept {money(offer.amount)}
          </button>
          <button type="button" disabled={busy} onClick={() => setCountering(true)} className="btn btn-outline btn-sm">
            Counter
          </button>
          <button type="button" disabled={busy} onClick={() => act("reject")} className={`${btn} text-danger hover:bg-danger-tint`}>
            Decline
          </button>
        </div>
      )}

      {countering && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act("counter", { amount: Number(counter) });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor={`counter-${offer._id}`} className="text-[13px] font-medium">
            Your price
          </label>
          <input
            id={`counter-${offer._id}`}
            type="number"
            inputMode="numeric"
            min={offer.amount + 1}
            max={offer.listPrice - 1}
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            className="field h-9 w-32 px-3"
          />
          <button type="submit" disabled={busy || !counter} className="btn btn-dark btn-sm">
            Send counter-offer
          </button>
          <button type="button" onClick={() => setCountering(false)} className={`${btn} text-muted`}>
            Cancel
          </button>
        </form>
      )}

      {side === "sent" && status === "countered" && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => act("accept")} className="btn btn-dark btn-sm">
            Accept {money(offer.counterAmount)}
          </button>
          <button type="button" disabled={busy} onClick={() => act("reject")} className="btn btn-outline btn-sm">
            Decline
          </button>
        </div>
      )}

      {side === "sent" && status === "pending" && (
        <button type="button" disabled={busy} onClick={() => act("withdraw")} className="self-start text-[13px] font-semibold text-brand hover:underline">
          Withdraw offer
        </button>
      )}

      {side === "sent" && status === "accepted" && (
        <Link to={`/product/${offer.product}`} className="btn btn-dark btn-sm self-start">
          Buy at {money(offer.amount)}
        </Link>
      )}
    </li>
  );
};

const Offers = () => {
  usePageTitle("Offers");
  const { authHeader } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "received" ? "received" : "sent";
  const [offers, setOffers] = useState(null);

  useEffect(() => {
    setOffers(null);
    axios
      .get(`${API}/offers/${tab === "received" ? "received" : "mine"}`, authHeader)
      .then(({ data }) => setOffers(data))
      .catch(() => setOffers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      <div>
        <h1 className="page-title">Offers</h1>
        <p className="text-sm text-muted">Haggle like a real market: buyers make offers, sellers accept, decline or counter.</p>
      </div>

      <div role="tablist" aria-label="Offers" className="tab-bar">
        {[
          ["sent", "Offers you made"],
          ["received", "Offers on your items"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams(key === "received" ? { tab: key } : {})}
            className={`tab ${tab === key ? "tab-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!offers ? (
        <div className="h-40 rounded-sm bg-white border border-line animate-pulse" />
      ) : offers.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line-strong bg-white py-14 text-center">
          <p className="font-semibold">No offers yet</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "sent" ? "Use “Make an offer” on any item for sale." : "When buyers make offers on your items, they show up here."}
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-line rounded-sm divide-y divide-line-soft">
          {offers.map((o) => (
            <OfferRow key={o._id} offer={o} side={tab} onChange={(next) => setOffers((list) => list.map((x) => (x._id === next._id ? next : x)))} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default Offers;
