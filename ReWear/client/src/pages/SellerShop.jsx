import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";

import API from "../utils/api";
import ProductCard from "../components/explore/ProductCard";
import { Stars } from "../components/ui/Stars";
import { NotFound } from "../components/ErrorBoundary";
import usePageTitle from "../hooks/usePageTitle";

const PER_PAGE = 12;

const SellerShop = ({ id }) => {
  const [seller, setSeller] = useState(undefined);
  const [items, setItems] = useState({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("items");
  usePageTitle(seller?.name ? `${seller.name}'s shop` : "Seller");

  useEffect(() => {
    axios
      .get(`${API}/users/${id}/public`)
      .then(({ data }) => setSeller(data))
      .catch(() => setSeller(null));
  }, [id]);

  useEffect(() => {
    axios
      .get(`${API}/products`, { params: { mode: "all", seller: id, page, limit: PER_PAGE } })
      .then(({ data }) => setItems(data))
      .catch(() => {});
  }, [id, page]);

  if (seller === null) return <NotFound />;

  if (!seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-32 rounded-sm bg-white border border-line animate-pulse" />
      </div>
    );
  }

  const { rating } = seller;

  // How many reviews gave each star count
  const spread = [5, 4, 3, 2, 1].map((n) => ({ n, count: seller.reviews.filter((r) => r.rating === n).length }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex gap-1.5">
        <Link to="/" className="text-brand hover:underline">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Sellers</span>
        <span aria-hidden="true">/</span>
        <span>{seller.name}</span>
      </nav>

      <section className="bg-white border border-line rounded-sm p-6 flex flex-wrap items-center gap-6">
        <span aria-hidden="true" className="w-16 h-16 rounded-full bg-[#f1e6d8] text-brand text-2xl font-bold flex items-center justify-center">
          {seller.name?.[0]?.toUpperCase()}
        </span>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold tracking-tight">{seller.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {rating.count ? (
              <>
                <Stars value={rating.avg} />
                <span className="font-semibold text-ink">{rating.avg.toFixed(1)}</span>
                <span>({rating.count} review{rating.count > 1 ? "s" : ""})</span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
            <span aria-hidden="true">·</span>
            <span>On ReWear since {format(new Date(seller.since), "MMMM yyyy")}</span>
          </p>
        </div>
        <dl className="flex gap-8 text-center">
          <div>
            <dt className="text-xs text-muted">For sale or rent</dt>
            <dd className="text-xl font-bold">{seller.liveCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Sold</dt>
            <dd className="text-xl font-bold">{seller.soldCount}</dd>
          </div>
        </dl>
      </section>

      <div role="tablist" aria-label="Shop sections" className="tab-bar">
        {[
          ["items", `Items (${items.total})`],
          ["reviews", `Reviews (${rating.count})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`tab ${tab === key ? "tab-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "items" ? (
        items.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">This seller has nothing listed right now.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {items.items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
            {items.pages > 1 && (
              <div className="flex justify-center gap-1.5">
                {[...Array(items.pages)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-current={page === i + 1 ? "page" : undefined}
                    onClick={() => setPage(i + 1)}
                    className={`min-w-[44px] h-10 rounded-md text-sm ${page === i + 1 ? "bg-ink text-paper font-semibold" : "bg-white border border-line"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )
      ) : seller.reviews.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">No reviews yet. Reviews appear after buyers complete an order.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
          <div className="bg-white border border-line rounded-sm p-5">
            <p className="text-3xl font-bold">{rating.avg.toFixed(1)}</p>
            <Stars value={rating.avg} size={16} />
            <p className="mt-1 text-[13px] text-muted">{rating.count} reviews</p>
            <ul className="mt-4 flex flex-col gap-1.5">
              {spread.map(({ n, count }) => (
                <li key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-6">{n}★</span>
                  <span className="flex-1 h-2 rounded bg-[#efe6da] overflow-hidden">
                    <span className="block h-full bg-[#c0834f]" style={{ width: `${seller.reviews.length ? (count / seller.reviews.length) * 100 : 0}%` }} />
                  </span>
                  <span className="w-5 text-right text-muted">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="bg-white border border-line rounded-sm divide-y divide-[#efe6da]">
            {seller.reviews.map((r) => (
              <li key={r._id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-semibold">{r.buyer}</span>
                  <span className="text-xs text-muted">· {format(new Date(r.createdAt), "d MMM yyyy")}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
                {r.title && <p className="mt-1.5 text-xs text-muted">Bought: {r.title}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// A fresh shop (and its state) for each seller
const SellerShopPage = () => {
  const { id } = useParams();
  return <SellerShop key={id} id={id} />;
};

export default SellerShopPage;
