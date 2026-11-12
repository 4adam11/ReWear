import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format, formatDistanceToNowStrict } from "date-fns";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Stars } from "../../components/ui/Stars";
import VerifiedBadge from "../../components/ui/VerifiedBadge";
import usePageTitle from "../../hooks/usePageTitle";

const TABS = [
  ["pending", "Waiting"],
  ["verified", "Verified"],
  ["rejected", "Declined"],
];

const Fact = ({ label, value, warn }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className={`text-sm font-semibold ${warn ? "text-danger" : ""}`}>{value}</dd>
  </div>
);

// One seller and the record an admin needs to decide on the badge
const SellerCard = ({ seller, tab, onDecided }) => {
  const { authHeader } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const v = seller.verification || {};

  const decide = async (decision) => {
    setBusy(true);
    setError("");
    try {
      await axios.patch(`${API}/admin/verifications/${seller._id}`, { decision, note }, authHeader);
      onDecided(seller._id);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the decision");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="w-11 h-11 rounded-full bg-sand text-brand font-bold flex items-center justify-center flex-shrink-0">
            {seller.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              {seller.name}
              {tab === "verified" && <VerifiedBadge />}
              {seller.blocked && <span className="text-xs font-semibold text-danger">Blocked</span>}
            </p>
            <p className="text-[13px] text-muted truncate" title={seller.email}>{seller.email}</p>
            <p className="text-[13px] text-muted">{seller.phone || "No phone"}</p>
          </div>
          <Link to={`/seller/${seller._id}`} className="ml-auto text-xs font-semibold text-brand hover:underline flex-shrink-0">
            View shop
          </Link>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
          <Fact label="On ReWear" value={formatDistanceToNowStrict(new Date(seller.createdAt))} />
          <Fact
            label="Rating"
            value={
              seller.rating?.count ? (
                <span className="inline-flex items-center gap-1">
                  <Stars value={seller.rating.avg} size={12} /> {seller.rating.avg.toFixed(1)} ({seller.rating.count})
                </span>
              ) : (
                "No reviews"
              )
            }
          />
          <Fact label="Listings (live / sold)" value={`${seller.listings.total} (${seller.listings.live} / ${seller.listings.sold})`} />
          <Fact label="Rejected listings" value={seller.listings.rejected} warn={seller.listings.rejected > 0} />
          <Fact label="Completed orders" value={seller.orders.completed} />
          <Fact label="Cancelled orders" value={seller.orders.cancelled} warn={seller.orders.cancelled > 2} />
          <Fact label="Refunded orders" value={seller.orders.refunded} warn={seller.orders.refunded > 0} />
          <Fact
            label={tab === "pending" ? "Asked" : "Decided"}
            value={format(new Date(tab === "pending" ? v.requestedAt : v.reviewedAt || v.requestedAt), "d MMM yyyy")}
          />
        </dl>

        {v.note && (
          <p className="border border-line bg-paper px-3.5 py-2.5 text-sm">
            <span className="block text-xs text-muted">The seller wrote</span>“{v.note}”
          </p>
        )}
        {tab === "rejected" && v.reason && (
          <p className="text-sm"><span className="font-semibold">Reason given:</span> {v.reason}</p>
        )}
      </div>

      {tab !== "rejected" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`vnote-${seller._id}`} className="text-sm font-semibold">
            {tab === "pending" ? "Decision" : "Remove the badge"}
          </label>
          <textarea
            id={`vnote-${seller._id}`}
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tab === "pending" ? "Needed when declining, e.g. Too few completed orders yet." : "Why, e.g. Several refunded orders."}
            className="field px-3 py-2"
          />
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          {tab === "pending" ? (
            <>
              <button type="button" disabled={busy} onClick={() => decide("approve")} className="btn btn-dark btn-sm">
                Approve badge
              </button>
              <button type="button" disabled={busy || note.trim().length < 5} onClick={() => decide("reject")} className="btn btn-outline btn-sm">
                Decline
              </button>
            </>
          ) : (
            <button type="button" disabled={busy || note.trim().length < 5} onClick={() => decide("revoke")} className="btn btn-outline btn-sm">
              Remove badge
            </button>
          )}
        </div>
      )}
    </article>
  );
};

const AdminVerification = () => {
  usePageTitle("Admin · Seller verification");
  const { authHeader } = useAuth();
  const [tab, setTab] = useState("pending");
  const [sellers, setSellers] = useState(null);

  useEffect(() => {
    setSellers(null);
    axios
      .get(`${API}/admin/verifications`, { ...authHeader, params: { status: tab } })
      .then(({ data }) => setSellers(data))
      .catch(() => setSellers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Seller verification</h1>
        <p className="mt-1 text-sm text-muted">
          Sellers ask for the verified badge once they have a mobile number, an approved listing and a day-old account. Check their record, then decide.
        </p>
      </div>

      <div className="tab-bar">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`tab ${tab === key ? "tab-active" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {!sellers ? (
        <div className="h-40 panel animate-pulse" />
      ) : sellers.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line-strong bg-white py-14 text-center text-sm text-muted">
          {tab === "pending" ? "No sellers waiting." : tab === "verified" ? "No verified sellers yet." : "No declined requests."}
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((s) => (
            <SellerCard key={s._id} seller={s} tab={tab} onDecided={(id) => setSellers((list) => list.filter((x) => x._id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
