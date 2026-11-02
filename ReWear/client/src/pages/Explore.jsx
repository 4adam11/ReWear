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

  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState(params.get("mode") || "sale");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // ✅ SAFE INITIAL FILTER STATE
  const [filters, setFilters] = useState({
    search: "",
    sizes: [],
    categories: [],
    maxPrice: 75000,
  });

  // 🔥 FETCH
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/products`);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  // 🔥 FINAL FILTER (100% SAFE)
  const filteredProducts = products
    .filter((product) => {
      if (!product) return false;

      const search = filters?.search || "";

      // ✅ FORCE ARRAY (THIS FIXES YOUR ERROR)
      const sizes = Array.isArray(filters?.sizes) ? filters.sizes : [];
      const categories = Array.isArray(filters?.categories)
        ? filters.categories
        : [];

      const maxPrice = filters?.maxPrice || 75000;

      // SEARCH
      if (
        search &&
        !product.title?.toLowerCase().includes(search)
      ) return false;

      // SIZE
      if (
        sizes.length > 0 &&
        !sizes.includes(product.size)
      ) return false;

      // CATEGORY (SAFE)
      if (
        categories.length > 0 &&
        !categories.includes(product.category?.toLowerCase())
      ) return false;

      // PRICE
      const price = product.price || product.rent || 0;
      if (price > maxPrice) return false;

      // MODE FIX
      const productMode = product.mode?.toLowerCase();

      if (mode === "sale") {
        if (!["sale", "sell", "both"].includes(productMode)) return false;
      }

      if (mode === "rent") {
        if (!["rent", "both"].includes(productMode)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sort === "low") return (a.price || a.rent) - (b.price || b.rent);
      if (sort === "high") return (b.price || b.rent) - (a.price || a.rent);
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
          {filteredProducts.length} items found
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