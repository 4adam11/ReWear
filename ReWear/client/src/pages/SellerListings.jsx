import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Plus, Pencil, Pause, Play, Trash2, ExternalLink, IndianRupee, Eye, Heart, MessageCircle } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import { categoryLabel } from "../utils/catalog";
import StatusBadge from "../components/ui/StatusBadge";
import usePageTitle from "../hooks/usePageTitle";
import { toast, confirmAction } from "../utils/feedback";

const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "pending", label: "In review" },
  { key: "rejected", label: "Needs changes" },
  { key: "paused", label: "Paused" },
  { key: "sold", label: "Sold" },
];

const isLive = (p) => ["live", "available"].includes(p.status);
const inTab = (p, tab) => tab === "all" || (tab === "live" ? isLive(p) : p.status === tab);

const canSell = (p) => ["sell", "sale", "both"].includes(p.mode);
const canRent = (p) => ["rent", "both"].includes(p.mode);

// Inline price editor. Saves the whole listing with new prices; on an approved
// listing price changes go live straight away (no re-review).
const PriceEditor = ({ product, onSaved, onClose }) => {
  const { authHeader } = useAuth();
  const [price, setPrice] = useState(product.price ?? "");
  const [rent, setRent] = useState(product.rent ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      // The edit endpoint takes the full listing, so start from the current one
      const { data: full } = await axios.get(`${API}/products/${product._id}`, authHeader);

      const { data } = await axios.put(
        `${API}/products/${product._id}`,
        {
          ...full,
          price: canSell(product) ? Number(price) : undefined,
          rent: canRent(product) ? Number(rent) : undefined,
        },
        authHeader
      );

      onSaved(data.product, data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the new price");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-3 rounded-sm border border-line bg-cream p-3">
      {canSell(product) && (
        <label className="text-xs text-muted">
          Selling price (₹)
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="field mt-1 block w-32 px-2.5 py-1.5"
          />
        </label>
      )}

      {canRent(product) && (
        <label className="text-xs text-muted">
          Rent per day (₹)
          <input
            type="number"
            min="1"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            className="field mt-1 block w-32 px-2.5 py-1.5"
          />
        </label>
      )}

      <button disabled={busy} className="btn btn-dark btn-sm">
        {busy ? "Saving…" : "Save price"}
      </button>
      <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-sm border border-line bg-white text-sm text-ink-soft">
        Cancel
      </button>

      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
};

const statusNote = (p) => {
  if (p.status === "pending") {
    return p.review?.everApproved
      ? "Your changes are waiting for admin approval. The listing is hidden until then."
      : "Waiting for admin approval before it appears to buyers.";
  }
  if (p.status === "rejected") return p.review?.rejectReason ? `Admin feedback: ${p.review.rejectReason}` : "Rejected by an admin.";
  if (p.status === "paused") return "Hidden from buyers. Relist it whenever you're ready.";
  if (p.status === "sold") return "Sold. Kept here for your records.";
  return null;
};

const SellerListings = () => {
  usePageTitle("My listings");
  const { authHeader } = useAuth();
  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  // A message handed over from the Sell page ("Listing sent for review...")
  const [notice, setNotice] = useState(location.state?.notice || "");

  // Drop it from history so a refresh doesn't show it again
  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/products/mine`, authHeader)
      .then(({ data }) => setListings(data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replace = (updated) =>
    setListings((list) => list.map((p) => (p._id === updated._id ? { ...p, ...updated, images: p.images } : p)));

  const run = async (request, success) => {
    try {
      const { data } = await request();
      success(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "That didn't work. Please try again.");
    }
  };

  const pause = (p) => run(() => axios.patch(`${API}/products/${p._id}/pause`, {}, authHeader), replace);
  const resume = (p) => run(() => axios.patch(`${API}/products/${p._id}/resume`, {}, authHeader), replace);

  const remove = async (p) => {
    const sure = await confirmAction({
      title: "Delete this listing?",
      body: `"${p.title}" and its photos will be removed. This can't be undone.`,
      confirmLabel: "Delete listing",
      danger: true,
    });
    if (!sure) return;
    run(
      () => axios.delete(`${API}/products/${p._id}`, authHeader),
      () => setListings((list) => list.filter((x) => x._id !== p._id))
    );
  };

  const counts = Object.fromEntries(TABS.map((t) => [t.key, listings.filter((p) => inTab(p, t.key)).length]));
  const shown = listings.filter((p) => inTab(p, tab));

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="page-title">My listings</h1>
            <p className="mt-1 text-sm text-muted">
              Change prices any time. New photos or details are checked by an admin before going live.
            </p>
          </div>

          <Link
            to="/sell"
            className="btn btn-dark btn-sm"
          >
            <Plus size={16} />
            New listing
          </Link>
        </div>

        {notice && (
          <div className="flex items-start justify-between gap-3 rounded-sm border border-success-line bg-success-tint px-4 py-3 text-sm text-success-strong">
            {notice}
            <button onClick={() => setNotice("")} className="text-success hover:underline">Dismiss</button>
          </div>
        )}

        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab ${tab === t.key ? "tab-active" : ""}`}
            >
              {t.label}
              <span className="ml-1.5 opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-40 rounded-sm bg-white border border-line animate-pulse" />
        ) : shown.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line-strong bg-white py-16 text-center">
            <p className="text-ink font-medium">No listings here</p>
            <p className="mt-1 text-sm text-muted">
              {listings.length === 0 ? "List your first item to start selling." : "Nothing in this tab right now."}
            </p>
          </div>
        ) : (
          <ul className="bg-white border border-line rounded-sm divide-y divide-line-soft">
            {shown.map((p) => {
              const note = statusNote(p);

              return (
                <li key={p._id} className="p-4 flex flex-col sm:flex-row gap-4">
                  <img
                    src={thumb(p.images?.[0], 200) || PLACEHOLDER_IMAGE}
                    alt={p.title}
                    loading="lazy"
                    className="w-20 h-24 rounded-sm object-cover border border-line flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-faint">
                        Updated {formatDistanceToNow(new Date(p.updatedAt || p.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="mt-1.5 font-medium text-ink truncate">{p.title}</p>
                    <p className="text-sm text-muted">
                      {canSell(p) && p.price ? `₹${p.price.toLocaleString("en-IN")}` : ""}
                      {canSell(p) && canRent(p) && p.price && p.rent ? " · " : ""}
                      {canRent(p) && p.rent ? `₹${p.rent.toLocaleString("en-IN")}/day rent` : ""}
                      <span className="text-faint"> · {categoryLabel(p.category)} · Size {p.size}</span>
                    </p>

                    {(isLive(p) || p.status === "sold" || p.views > 0) && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1.5" title="Views (each person counted once a day)">
                          <Eye size={14} aria-hidden="true" />
                          {p.views || 0} view{p.views === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1.5" title="People who saved it to their wishlist">
                          <Heart size={14} aria-hidden="true" />
                          {p.saves || 0} saved
                        </span>
                        <span className="inline-flex items-center gap-1.5" title="Buyers who messaged you about it">
                          <MessageCircle size={14} aria-hidden="true" />
                          {p.questions || 0} question{p.questions === 1 ? "" : "s"}
                        </span>
                      </p>
                    )}

                    {note && (
                      <p className={`mt-1.5 text-sm ${p.status === "rejected" ? "text-danger" : "text-muted"}`}>{note}</p>
                    )}

                    {editingPrice === p._id && (
                      <PriceEditor
                        product={p}
                        onClose={() => setEditingPrice(null)}
                        onSaved={(updated, message) => {
                          replace(updated);
                          setEditingPrice(null);
                          setNotice(message);
                        }}
                      />
                    )}
                  </div>

                  {/* ACTIONS */}
                  {p.status !== "sold" && editingPrice !== p._id && (
                    <div className="flex sm:flex-col flex-wrap gap-2 sm:w-36 flex-shrink-0">
                      <button
                        onClick={() => setEditingPrice(p._id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm border border-line text-sm text-ink-soft hover:bg-cream"
                      >
                        <IndianRupee size={14} />
                        Edit price
                      </button>

                      <Link
                        to={`/sell/${p._id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm border border-line text-sm text-ink-soft hover:bg-cream"
                      >
                        <Pencil size={14} />
                        {p.status === "rejected" ? "Fix & resubmit" : "Edit details"}
                      </Link>

                      {isLive(p) && (
                        <button
                          onClick={() => pause(p)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm border border-line text-sm text-ink-soft hover:bg-cream"
                        >
                          <Pause size={14} />
                          Pause
                        </button>
                      )}

                      {p.status === "paused" && (
                        <button
                          onClick={() => resume(p)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm border border-line text-sm text-ink-soft hover:bg-cream"
                        >
                          <Play size={14} />
                          Relist
                        </button>
                      )}

                      <button
                        onClick={() => remove(p)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm border border-danger-line text-sm text-danger hover:bg-danger-tint"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}

                  {p.status === "sold" && (
                    <Link
                      to={`/product/${p._id}`}
                      className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-ink"
                    >
                      <ExternalLink size={14} />
                      View
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SellerListings;
