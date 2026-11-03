import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import FiltersSidebar from "../components/explore/FiltersSidebar";
import ProductCard from "../components/explore/ProductCard";
import ProductGrid from "../components/explore/ProductGrid";
import ExploreHeader from "../components/explore/ExploreHeader";

import API from "../utils/api";
const ITEMS_PER_PAGE = 9;

const Explore = () => {
  const [params, setParams] = useSearchParams();

  const [result, setResult] = useState({
    items: [],
    total: 0,
    pages: 1,
  });
  const [mode, setMode] = useState(params.get("mode") === "rent" ? "rent" : "sale");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // ✅ SAFE INITIAL FILTER STATE (category links from the home page land here)
  const [filters, setFilters] = useState({
    search: "",
    sizes: [],
    categories: params.get("category") ? [params.get("category")] : [],
    maxPrice: 75000,
  });

  // Wait until typing pauses before searching
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  // 🔥 FETCH ONE PAGE (filtering, sorting and paging happen on the server)
  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(`${API}/products`, {
          params: {
            mode,
            search: debouncedSearch || undefined,
            categories: filters.categories.join(",") || undefined,
            sizes: filters.sizes.join(",") || undefined,
            maxPrice: filters.maxPrice,
            sort: sort === "default" ? undefined : sort,
            page,
            limit: ITEMS_PER_PAGE,
          },
        });

        // Ignore responses that arrive after the filters changed again
        if (!ignore) setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [mode, debouncedSearch, filters.categories, filters.sizes, filters.maxPrice, sort, page]);

  // 🔥 URL SYNC
  useEffect(() => {
    const category = Array.isArray(filters.categories)
      ? filters.categories[0]
      : "";

    setParams({
      mode,
      category: category || "",
    });
  }, [mode, filters.categories]);

  // RESET PAGE
  useEffect(() => {
    // Prevent unnecessary rerenders
    if (page !== 1) {
      setPage(1);
    }
  }, [mode, filters, sort]);

  // SCROLL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const totalPages = result.pages;

  const paginatedProducts = result.items;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

      {/* HEADER */}
      <ExploreHeader
        mode={mode}
        setMode={setMode}
        search={filters.search}
        setSearch={(val) =>
          setFilters((prev) => ({
            ...prev,
            search: val.toLowerCase(),
          }))
        }
      />

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">

        <p className="text-sm sm:text-base text-gray-500 font-medium">
          {result.total} items found
        </p>

        {/* SORT */}
        <div className="relative w-full sm:w-[220px]">

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="
            w-full
            rounded-2xl
            border
            border-white/40
            bg-white/80
            backdrop-blur-xl
            px-5
            py-3
            text-sm
            font-medium
            text-gray-700
            shadow-lg
            focus:outline-none
            focus:ring-2
            focus:ring-indigo-500
          "
          >
            <option value="default">
              Sort Products
            </option>

            <option value="low">
              Price: Low to High
            </option>

            <option value="high">
              Price: High to Low
            </option>

          </select>

        </div>

      </div>

      {/* MAIN LAYOUT */}
      <div className="mt-10 flex flex-col xl:flex-row gap-8 items-start">

        {/* SIDEBAR */}
        <div className="w-full xl:w-[320px] xl:sticky xl:top-24 flex-shrink-0">

          <FiltersSidebar
            filters={filters}
            setFilters={setFilters}
          />

        </div>

        {/* PRODUCTS */}
        <div className="flex-1 min-w-0 w-full">

          {/* LOADING */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 xl:gap-7">

              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-[480px] rounded-[30px] bg-white/70 animate-pulse"
                />
              ))}

            </div>
          ) : (

            <>
              {/* PRODUCT GRID */}
              <ProductGrid
                products={paginatedProducts}
              />

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-14 flex items-center justify-center gap-3 flex-wrap">

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}

                      onClick={() =>
                        setPage(i + 1)
                      }

                      className={`
                      min-w-[48px]
                      h-12
                      px-4
                      rounded-2xl
                      text-sm
                      font-bold
                      transition-all
                      duration-300
                      ${page === i + 1
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl"
                          : "bg-white/80 border border-gray-100 text-gray-700 hover:border-indigo-300 shadow-sm"
                        }
                    `}
                    >
                      {i + 1}
                    </button>
                  ))}

                </div>
              )}

            </>
          )}

        </div>

      </div>

    </div>
  );
};

export default Explore;