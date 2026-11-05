import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

import API from "../utils/api";
import { CATEGORIES, SIZES, categoryLabel, categoryInfo } from "../utils/catalog";
import ProductCard from "../components/explore/ProductCard";
import usePageTitle from "../hooks/usePageTitle";
import { money } from "../utils/format";

const PER_PAGE = 12;
const PRICE_MAX = 20000;

const MODES = [
  { value: "all", label: "Buy or rent" },
  { value: "rent", label: "Rent only" },
  { value: "sale", label: "Buy only" },
];

const SORTS = [
  { value: "new", label: "Newest first" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const list = (v) => (v ? v.split(",").filter(Boolean) : []);

const FilterGroup = ({ title, children }) => (
  <fieldset className="py-4 border-b border-line last:border-b-0">
    <legend className="sr-only">{title}</legend>
    <p aria-hidden="true" className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-ink mb-3">
      {title}
    </p>
    {children}
  </fieldset>
);

const Explore = () => {
  const [params, setParams] = useSearchParams();

  // Everything lives in the URL, so header search, category links and the back button all work
  const mode = ["rent", "sale"].includes(params.get("mode")) ? params.get("mode") : "all";
  const categories = list(params.get("category"));
  const sizes = list(params.get("sizes"));
  const maxPrice = Number(params.get("maxPrice")) || 0;
  const sort = params.get("sort") || "new";
  const search = params.get("search") || "";
  const seller = params.get("seller") || "";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const [result, setResult] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [price, setPrice] = useState(maxPrice || PRICE_MAX);

  useEffect(() => {
    setPrice(maxPrice || PRICE_MAX);
  }, [maxPrice]);

  const update = (changes, { keepPage = false, replace = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === "" || v == null || (Array.isArray(v) && !v.length)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(",") : v);
    });
    if (!keepPage) next.delete("page");
    setParams(next, { replace });
  };

  const toggle = (key, values, value) =>
    update({ [key]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] });

  // Apply the price slider once the user stops dragging
  useEffect(() => {
    if (price === (maxPrice || PRICE_MAX)) return;
    const t = setTimeout(() => update({ maxPrice: price >= PRICE_MAX ? "" : price }, { replace: true }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const key = params.toString();

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    axios
      .get(`${API}/products`, {
        params: {
          mode,
          search: search || undefined,
          categories: categories.join(",") || undefined,
          sizes: sizes.join(",") || undefined,
          maxPrice: maxPrice || undefined,
          sort,
          seller: seller || undefined,
          page,
          limit: PER_PAGE,
        },
      })
      .then(({ data }) => !ignore && setResult(data))
      .catch(() => !ignore && setResult({ items: [], total: 0, pages: 1 }))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const heading =
    seller ? result.items[0]?.sellerName ? `${result.items[0].sellerName}'s items` : "Seller's items"
      : categories.length === 1 ? categoryInfo(categories[0])?.title || `${categoryLabel(categories[0])} wear`
        : mode === "rent" ? "Rent an outfit"
          : mode === "sale" ? "Buy pre-loved"
            : "All fashion";

  usePageTitle(search ? `"${search}"` : heading);

  // Active filter chips
  const chips = [
    ...(mode !== "all" ? [{ label: MODES.find((m) => m.value === mode).label, clear: () => update({ mode: "" }) }] : []),
    ...(categories.length > 1 ? categories.map((c) => ({ label: categoryLabel(c), clear: () => toggle("category", categories, c) })) : []),
    ...sizes.map((s) => ({ label: `Size ${s}`, clear: () => toggle("sizes", sizes, s) })),
    ...(maxPrice ? [{ label: `Up to ${money(maxPrice)}`, clear: () => update({ maxPrice: "" }) }] : []),
    ...(search ? [{ label: `“${search}”`, clear: () => update({ search: "" }) }] : []),
    ...(seller ? [{ label: "This seller", clear: () => update({ seller: "" }) }] : []),
  ];

  // One occasion picked: show its banner
  const single = categories.length === 1 && !seller ? categoryInfo(categories[0]) : null;
  const counts = result.categoryCounts;

  const first = result.total ? (page - 1) * PER_PAGE + 1 : 0;
  const last = Math.min(page * PER_PAGE, result.total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted flex gap-1.5">
        <Link to="/" className="text-brand hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span>{heading}</span>
      </nav>

      <header className="mt-3 mb-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            {single && (
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: single.color }}>
                Shop by occasion
              </p>
            )}
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold uppercase tracking-[0.04em]">{heading}</h1>
            <span aria-hidden="true" className="mt-2 block h-1 w-12" style={{ backgroundColor: single?.color || "#2b1d14" }} />
          </div>
          <p className="text-sm text-muted">
            {loading ? "Loading…" : `${result.total} style${result.total === 1 ? "" : "s"} found`}
            {search && ` for “${search}”`}
          </p>
        </div>
        {single && <p className="mt-3 max-w-2xl text-[15px] text-muted">{single.tagline}</p>}
      </header>

      {/* CATEGORY PILLS with live counts */}
      <nav aria-label="Occasions" className="scroll-row -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => update({ category: "" })}
          aria-pressed={categories.length === 0}
          className={`flex-shrink-0 h-9 px-4 rounded-full border text-sm font-semibold transition ${categories.length === 0 ? "bg-ink border-ink text-paper" : "bg-white border-line text-ink hover:border-ink"}`}
        >
          All{counts ? ` · ${Object.values(counts).reduce((a, b) => a + b, 0)}` : ""}
        </button>
        {CATEGORIES.map((c) => {
          const on = categories.length === 1 && categories[0] === c.value;
          const n = counts?.[c.value] || 0;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ category: on ? "" : c.value })}
              aria-pressed={on}
              className={`flex-shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-semibold transition ${on ? "text-white" : "bg-white border-line text-ink hover:border-ink"} ${counts && !n && !on ? "opacity-50" : ""}`}
              style={on ? { backgroundColor: c.color, borderColor: c.color } : undefined}
            >
              {!on && <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />}
              {c.label}
              {counts && <span className={on ? "text-white/80" : "text-muted font-medium"}>{n}</span>}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* FILTERS */}
        <aside
          aria-label="Filters"
          className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-60 flex-shrink-0 bg-white lg:bg-transparent border border-line lg:border-0 lg:border-r lg:pr-5 px-4 lg:px-0 rounded-lg lg:rounded-none lg:sticky lg:top-40`}
        >
          <div className="flex items-center justify-between py-3 border-b border-line">
            <span className="font-display text-sm font-bold uppercase tracking-[0.14em]">Filters</span>
            <button
              type="button"
              onClick={() => setParams(search ? { search } : {})}
              className="text-[13px] font-semibold text-brand hover:text-brand-dark py-1"
            >
              Clear all
            </button>
          </div>

          <FilterGroup title="I want to">
            <div className="flex flex-col gap-2.5">
              {MODES.map((m) => (
                <label key={m.value} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === m.value}
                    onChange={() => update({ mode: m.value === "all" ? "" : m.value })}
                    className="w-4 h-4 accent-[#6b4430]"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Category">
            <div className="flex flex-col gap-2.5">
              {CATEGORIES.map((c) => (
                <label key={c.value} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(c.value)}
                    onChange={() => toggle("category", categories, c.value)}
                    className="w-4 h-4 accent-[#6b4430]"
                  />
                  <span className="flex-1">{c.label}</span>
                  {counts && <span className="text-xs text-muted">{counts[c.value] || 0}</span>}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Size">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => {
                const on = sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle("sizes", sizes, s)}
                    className={`min-w-[44px] h-9 px-2 rounded-md border text-[13px] ${on ? "bg-brand border-brand text-white font-semibold" : "bg-white border-[#d9cbb9] text-ink hover:border-brand"}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <div className="py-4">
            <label htmlFor="max-price" className="block font-display text-xs font-semibold tracking-[0.14em] uppercase text-ink mb-3">
              Max price{mode === "rent" ? " per day" : ""}
            </label>
            <input
              id="max-price"
              type="range"
              min={500}
              max={PRICE_MAX}
              step={500}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-[#6b4430]"
            />
            <div className="flex justify-between text-[13px] text-muted mt-1">
              <span>₹500</span>
              <span className="font-semibold text-ink">{price >= PRICE_MAX ? "Any price" : `Up to ${money(price)}`}</span>
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section aria-label="Results" className="flex-1 min-w-0 w-full flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-y border-line py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#d9cbb9] text-[13px] font-semibold"
              >
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <span className="text-[13px] text-muted">{result.total ? `Showing ${first}–${last}` : "No results"}</span>
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  aria-label={`Remove filter ${c.label}`}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-line bg-cream text-[13px] hover:border-brand"
                >
                  {c.label}
                  <X size={13} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-[13px] text-muted">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "new" ? "" : e.target.value })}
                className="h-9 px-2.5 rounded-md border border-[#d9cbb9] bg-white text-[13px]"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/5] bg-white animate-pulse" />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d9cbb9] bg-white py-16 px-6 text-center">
              <p className="font-semibold">Nothing matches these filters</p>
              <p className="mt-1 text-sm text-muted">Try removing a filter or searching for something else.</p>
              <button
                type="button"
                onClick={() => setParams({})}
                className="mt-4 btn btn-dark btn-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4">
              {result.items.map((p) => (
                <ProductCard key={p._id} product={p} prefer={mode === "rent" ? "rent" : undefined} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav aria-label="Pagination" className="flex justify-center flex-wrap gap-1.5 py-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 }, { keepPage: true })}
                aria-label="Previous page"
                className="w-11 h-10 rounded-md border border-line bg-white flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(result.pages)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={page === i + 1 ? "page" : undefined}
                  onClick={() => update({ page: i + 1 }, { keepPage: true })}
                  className={`min-w-[44px] h-10 rounded-md text-sm ${page === i + 1 ? "bg-ink text-paper font-semibold" : "bg-white border border-line hover:border-brand"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= result.pages}
                onClick={() => update({ page: page + 1 }, { keepPage: true })}
                aria-label="Next page"
                className="w-11 h-10 rounded-md border border-line bg-white flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore;
