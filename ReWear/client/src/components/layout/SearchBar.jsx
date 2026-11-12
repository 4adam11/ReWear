import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, Clock, X } from "lucide-react";

import API from "../../utils/api";
import { cardImage, PLACEHOLDER_IMAGE } from "../../utils/image";
import { categoryInfo } from "../../utils/catalog";
import { money } from "../../utils/format";

const RECENT_KEY = "rewear-recent-searches";
const MAX_RECENT = 5;
const EMPTY = { categories: [], items: [] };

const readRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(list) ? list.filter((s) => typeof s === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const saveRecent = (list) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: recent searches just won't be remembered
  }
};

const priceOf = (p) => (p.price > 0 ? money(p.price) : p.rent > 0 ? `${money(p.rent)}/day` : "");

// Header search with suggestions while typing and the last few searches when empty.
// Arrow keys move through the list, Enter opens the highlighted row, Escape closes it.
const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const current = location.pathname === "/explore" ? params.get("search") || "" : "";
  const [text, setText] = useState(current);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(EMPTY);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState(readRecent);
  const boxRef = useRef();

  // Keep the box in step with the URL (back button, category links)
  useEffect(() => {
    setText(current);
  }, [current]);

  const query = text.trim();
  const typing = query.length >= 2;

  // Ask for suggestions shortly after the user stops typing
  useEffect(() => {
    if (!typing) return;

    let ignore = false;
    const timer = setTimeout(() => {
      axios
        .get(`${API}/products/suggest`, { params: { q: query } })
        .then(({ data }) => !ignore && setResults(data))
        .catch(() => !ignore && setResults(EMPTY));
    }, 200);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, typing]);

  // Close when clicking anywhere else
  useEffect(() => {
    const handler = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = (value) => {
    const q = value.trim();
    const next = new URLSearchParams(location.pathname === "/explore" ? params : undefined);

    if (q) {
      next.set("search", q);
      const list = [q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      setRecent(list);
      saveRecent(list);
    } else {
      next.delete("search");
    }
    next.delete("page");

    setOpen(false);
    setActive(-1);
    navigate(`/explore?${next}`);
  };

  const go = (path) => {
    setOpen(false);
    setActive(-1);
    setText("");
    navigate(path);
  };

  // One flat list of rows so the arrow keys can walk through every kind of suggestion
  const shown = typing ? results : EMPTY;
  const rows = typing
    ? [
        { key: "search", kind: "search", run: () => runSearch(query) },
        ...shown.categories.map((c) => ({ key: `c-${c}`, kind: "category", value: c, run: () => go(`/explore?category=${c}`) })),
        ...shown.items.map((p) => ({ key: p._id, kind: "item", value: p, run: () => go(`/product/${p._id}`) })),
      ]
    : recent.map((r) => ({ key: `r-${r}`, kind: "recent", value: r, run: () => runSearch(r) }));

  const showList = open && rows.length > 0;

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" && rows.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp" && rows.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const row = showList ? rows.at(active) : null;
    if (active >= 0 && row) row.run();
    else runSearch(text);
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const rowClass = (i) =>
    `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-pointer ${i === active ? "bg-cream" : "hover:bg-cream"}`;

  return (
    <form
      ref={boxRef}
      role="search"
      onSubmit={submit}
      className="relative flex flex-1 min-w-0 max-w-2xl order-last basis-full md:order-none md:basis-auto"
    >
      <label htmlFor="site-search" className="sr-only">
        Search ReWear
      </label>
      <input
        id="site-search"
        type="text"
        inputMode="search"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `search-row-${active}` : undefined}
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search lehengas, sherwanis, sarees, kurtas…"
        className="flex-1 min-w-0 h-10 pl-5 pr-20 rounded-full bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1 w-8 h-8 rounded-full text-ink flex items-center justify-center hover:bg-cream after:absolute after:-inset-1.5 after:content-['']"
      >
        <Search size={18} />
      </button>

      {showList && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-transparent rounded-sm shadow-menu overflow-hidden z-50">
          {!typing && (
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Recent searches</span>
              <button type="button" onClick={clearRecent} className="text-xs font-semibold text-brand hover:underline">
                Clear
              </button>
            </div>
          )}

          <ul id="search-suggestions" role="listbox" aria-label="Search suggestions" className="max-h-[70vh] overflow-y-auto overscroll-contain py-1">
            {rows.map((row, i) => (
              <li
                key={row.key}
                id={`search-row-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                // mousedown, not click, so the row runs before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  row.run();
                }}
                className={rowClass(i)}
              >
                {row.kind === "search" && (
                  <>
                    <Search size={16} className="text-muted flex-shrink-0" />
                    <span className="truncate">
                      Search for <strong>“{query}”</strong>
                    </span>
                  </>
                )}

                {row.kind === "recent" && (
                  <>
                    <Clock size={16} className="text-muted flex-shrink-0" />
                    <span className="truncate">{row.value}</span>
                  </>
                )}

                {row.kind === "category" && (
                  <>
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryInfo(row.value)?.color }}
                    />
                    <span className="truncate">
                      <strong>{categoryInfo(row.value)?.label}</strong>
                      <span className="text-muted"> · shop the occasion</span>
                    </span>
                  </>
                )}

                {row.kind === "item" && (
                  <>
                    <img
                      src={cardImage(row.value.image, 80) || PLACEHOLDER_IMAGE}
                      alt=""
                      className="w-9 h-12 object-cover bg-cream flex-shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{row.value.title}</span>
                      <span className="block text-xs text-muted">
                        {categoryInfo(row.value.category)?.label} · {priceOf(row.value)}
                      </span>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>

          {typing && shown.items.length === 0 && shown.categories.length === 0 && (
            <p className="px-4 pb-3 text-xs text-muted">No matching listings yet. Press Enter to search anyway.</p>
          )}
        </div>
      )}

      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            setActive(-1);
            document.getElementById("site-search")?.focus();
          }}
          className="absolute right-10 top-1 w-8 h-8 rounded-full text-muted flex items-center justify-center hover:text-ink after:absolute after:-inset-1.5 after:content-['']"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
};

export default SearchBar;
