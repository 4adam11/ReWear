import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Bot, ExternalLink, Search } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../../utils/image";
import { categoryLabel } from "../../utils/catalog";
import StatusBadge from "../../components/ui/StatusBadge";
import usePageTitle from "../../hooks/usePageTitle";

const TABS = [
  { key: "pending", label: "In review" },
  { key: "flagged", label: "AI flagged" },
  { key: "live", label: "Live" },
  { key: "rejected", label: "Rejected" },
  { key: "paused", label: "Paused" },
  { key: "sold", label: "Sold" },
  { key: "all", label: "All" },
];

const REASONS = [
  "Photos don't clearly show the item",
  "This doesn't look like clothing",
  "Inappropriate or offensive content",
  "Price looks unrealistic",
  "Title or description is misleading",
];

const price = (p) =>
  [
    p.price ? `Buy ₹${p.price.toLocaleString("en-IN")}` : null,
    p.rent ? `Rent ₹${p.rent.toLocaleString("en-IN")}/day` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const ListingReview = ({ item, onDone }) => {
  const { authHeader } = useAuth();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canApprove = ["pending", "rejected"].includes(item.status);
  const canReject = !["rejected", "sold"].includes(item.status);
  const isLive = ["live", "available", "paused"].includes(item.status);

  const act = async (action, body) => {
    setBusy(true);
    setError("");

    try {
      const { data } = await axios.patch(`${API}/admin/listings/${item._id}/${action}`, body, authHeader);
      onDone(data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white border border-line rounded-sm overflow-hidden">
      <div className="p-5 flex flex-col md:flex-row gap-5">

        {/* PHOTOS (all of them, so the admin sees what buyers will see) */}
        <div className="flex md:flex-col gap-2 md:w-40 flex-shrink-0 overflow-x-auto">
          {(item.images?.length ? item.images : [null]).map((url, i) => (
            <a key={i} href={url || undefined} target="_blank" rel="noreferrer" className="flex-shrink-0">
              <img
                src={thumb(url, 320) || PLACEHOLDER_IMAGE}
                alt={`${item.title} photo ${i + 1}`}
                loading="lazy"
                className={`object-cover rounded-sm border border-line ${i === 0 ? "w-32 h-40 md:w-40 md:h-48" : "w-20 h-24 md:w-40 md:h-24"}`}
              />
            </a>
          ))}
        </div>

        {/* DETAILS */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            {item.review?.aiFlagged && <StatusBadge status="flagged" />}
            <span className="text-xs text-faint">
              {item.review?.submittedAt
                ? `Submitted ${formatDistanceToNow(new Date(item.review.submittedAt), { addSuffix: true })}`
                : `Created ${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}`}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold text-ink">{item.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {categoryLabel(item.category)} · Size {item.size} · {item.condition} · {price(item)}
          </p>

          {item.description && (
            <p className="mt-3 text-sm text-ink-soft whitespace-pre-line line-clamp-4">{item.description}</p>
          )}

          <p className="mt-3 text-sm text-muted">
            Seller: <span className="text-ink-soft font-medium">{item.user?.name || "Unknown"}</span>
            {item.user?.email && <span> · {item.user.email}</span>}
            {item.user?.blocked && <StatusBadge status="blocked" className="ml-2" />}
          </p>

          {/* AI CHECK: advice for the admin, not a decision */}
          <div
            className={`mt-4 flex items-start gap-2 rounded-sm px-3 py-2.5 text-sm ${item.review?.aiFlagged
              ? "bg-warning-tint text-warning-strong border border-warning-line"
              : "bg-cream text-muted border border-line"
              }`}
          >
            <Bot size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-medium">AI photo check: </span>
              {item.review?.aiFlagged
                ? item.review.aiNotes.join(" ")
                : "no problems found. Please still check the photos yourself."}
            </span>
          </div>

          {item.status === "rejected" && item.review?.rejectReason && (
            <p className="mt-3 text-sm text-danger">
              Rejected{item.review.reviewedBy?.name ? ` by ${item.review.reviewedBy.name}` : ""}: {item.review.rejectReason}
            </p>
          )}

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          {/* REJECT FORM */}
          {rejecting && (
            <div className="mt-4 rounded-sm border border-line p-3">
              <p className="text-sm font-medium text-ink-soft">
                {isLive ? "Why are you taking this listing down?" : "Why are you rejecting this listing?"}
              </p>
              <p className="text-xs text-muted mt-0.5">The seller will see this message.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`px-2.5 py-1 rounded-sm border text-xs transition-colors ${reason === r ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-field"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Or write your own reason"
                className="field mt-3 px-3 py-2"
              />

              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy || reason.trim().length < 5}
                  onClick={() => act("reject", { reason })}
                  className="px-4 py-2 rounded-sm bg-danger text-white text-sm font-medium hover:bg-danger-strong disabled:opacity-40"
                >
                  {isLive ? "Take down" : "Reject listing"}
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        {!rejecting && (
          <div className="flex md:flex-col gap-2 md:w-36 flex-shrink-0">
            {canApprove && (
              <button
                disabled={busy}
                onClick={() => act("approve", {})}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-success text-white text-sm font-medium hover:bg-success-strong disabled:opacity-40"
              >
                <Check size={16} />
                Approve
              </button>
            )}

            {canReject && (
              <button
                disabled={busy}
                onClick={() => setRejecting(true)}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm border border-danger-line text-danger text-sm font-medium hover:bg-danger-tint disabled:opacity-40"
              >
                <X size={16} />
                {isLive ? "Take down" : "Reject"}
              </button>
            )}

            <Link
              to={`/product/${item._id}`}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm border border-line text-ink-soft text-sm hover:bg-cream"
            >
              <ExternalLink size={16} />
              View page
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};

const AdminListings = () => {
  usePageTitle("Admin · Review queue");
  const { authHeader } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("status") || "pending";

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const status = tab === "flagged" ? "pending" : tab;

    axios
      .get(`${API}/admin/listings`, {
        ...authHeader,
        params: { status, flagged: tab === "flagged" ? 1 : undefined, search: query || undefined, page },
      })
      .then(({ data }) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err.response?.data?.message || "Could not load listings"))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query, page]);

  // After approve/reject, drop the item from tabs it no longer belongs to
  const handleDone = (updated) => {
    setResult((r) => {
      const stillHere =
        tab === "all" ||
        (tab === "live" && ["live", "available"].includes(updated.status)) ||
        tab === updated.status;

      return {
        ...r,
        total: stillHere ? r.total : r.total - 1,
        items: stillHere
          ? r.items.map((i) => (i._id === updated._id ? { ...i, ...updated, user: i.user } : i))
          : r.items.filter((i) => i._id !== updated._id),
      };
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          New and edited listings stay hidden until you approve them. The AI check flags anything it's unsure about, but you make the final call.
        </p>
      </div>

      {/* TABS + SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="tab-bar md:flex-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setParams(t.key === "pending" ? {} : { status: t.key });
                setPage(1);
              }}
              className={`tab ${tab === t.key ? "tab-active" : ""}`}
            >
              {t.label}
              {tab === t.key && !loading && <span className="ml-1.5 opacity-70">{result.total}</span>}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
          className="relative md:w-64"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles"
            className="field pl-9 pr-3 py-2"
          />
        </form>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-sm bg-white border border-line animate-pulse" />
          ))}
        </div>
      ) : result.items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line-strong bg-white py-16 text-center">
          <p className="text-ink font-medium">Nothing here</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "pending" ? "All caught up: no listings are waiting for review." : "No listings match this view."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.items.map((item) => (
            <ListingReview key={item._id} item={item} onDone={handleDone} />
          ))}
        </div>
      )}

      {result.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-sm border border-line bg-white text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {result.pages}
          </span>
          <button
            disabled={page >= result.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-sm border border-line bg-white text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminListings;
