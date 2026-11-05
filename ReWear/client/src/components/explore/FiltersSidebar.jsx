import { useState } from "react";
import { CATEGORIES, SIZES } from "../../utils/catalog";

import { motion } from "framer-motion";

import {
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const FiltersSidebar = ({
  filters,
  setFilters,
}) => {
  const [localSearch, setLocalSearch] = useState(
    filters.search || ""
  );

  const [localPrice, setLocalPrice] = useState(
    filters.maxPrice || 75000
  );

  // TOGGLE SIZE
  const toggleSize = (size) => {
    const sizes = filters.sizes || [];

    const updated = sizes.includes(size)
      ? sizes.filter((s) => s !== size)
      : [...sizes, size];

    setFilters((prev) => ({
      ...prev,
      sizes: updated,
    }));
  };

  // TOGGLE CATEGORY
  const toggleCategory = (cat) => {
    const categories = filters.categories || [];

    const updated = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat];

    setFilters((prev) => ({
      ...prev,
      categories: updated,
    }));
  };

  // APPLY
  const handleApply = () => {
    setFilters((prev) => ({
      ...prev,
      search: localSearch.toLowerCase(),
      maxPrice: Number(localPrice),
    }));
  };

  // CLEAR
  const clearFilters = () => {
    setFilters({
      search: "",
      sizes: [],
      categories: [],
      maxPrice: 75000,
    });

    setLocalSearch("");
    setLocalPrice(75000);
  };

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: -40,
      }}

      animate={{
        opacity: 1,
        x: 0,
      }}

      transition={{
        duration: 0.7,
      }}

      className="relative w-full lg:w-[320px] overflow-hidden rounded-[32px] border border-white/40 bg-white/70 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.06)] p-6 sm:p-7 lg:sticky lg:top-24 h-fit"
    >

      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-80px] right-[-60px] w-[180px] h-[180px] rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="absolute bottom-[-100px] left-[-60px] w-[200px] h-[200px] rounded-full bg-pink-200/20 blur-3xl" />

      {/* CONTENT */}
      <div className="relative z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <motion.div
              animate={{
                rotate: [0, 10, 0],
              }}

              transition={{
                repeat: Infinity,
                duration: 4,
              }}

              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl"
            >
              <SlidersHorizontal size={22} />
            </motion.div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#2b1d14]">
                Filters
              </h2>

              <p className="text-sm text-gray-500">
                Refine your vibe
              </p>
            </div>

          </div>

          {/* CLEAR */}
          <motion.button
            whileHover={{
              scale: 1.08,
            }}

            whileTap={{
              scale: 0.94,
            }}

            onClick={clearFilters}

            className="w-10 h-10 rounded-full bg-white/80 border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition"
          >
            <X size={18} />
          </motion.button>

        </div>

        {/* SEARCH */}
        <div className="mt-8">

          <p className="text-sm font-semibold text-gray-700 mb-3">
            Search
          </p>

          <div className="relative">

            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl" />

            <input
              value={localSearch}

              onChange={(e) =>
                setLocalSearch(e.target.value)
              }

              placeholder="Search styles..."

              className="relative w-full rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl px-5 py-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

          </div>

        </div>

        {/* SIZE */}
        <div className="mt-8">

          <div className="flex items-center gap-2 mb-4">

            <Sparkles
              size={16}
              className="text-indigo-500"
            />

            <p className="text-sm font-semibold text-gray-700">
              Sizes
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {SIZES.map(
              (size, i) => {
                const active =
                  filters.sizes?.includes(size);

                return (
                  <motion.button
                    key={size}

                    whileHover={{
                      y: -3,
                    }}

                    whileTap={{
                      scale: 0.95,
                    }}

                    onClick={() =>
                      toggleSize(size)
                    }

                    className={`relative overflow-hidden px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${active
                        ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white/80 border border-gray-100 text-gray-700 hover:border-indigo-200 shadow-sm"
                      }`}
                  >

                    {/* FLOATING GLOW */}
                    {active && (
                      <motion.div
                        animate={{
                          x: ["-100%", "100%"],
                        }}

                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear",
                        }}

                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    )}

                    <span className="relative z-10">
                      {size}
                    </span>

                  </motion.button>
                );
              }
            )}

          </div>

        </div>

        {/* CATEGORY */}
        <div className="mt-8">

          <div className="flex items-center gap-2 mb-4">

            <Sparkles
              size={16}
              className="text-pink-500"
            />

            <p className="text-sm font-semibold text-gray-700">
              Categories
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {CATEGORIES.map(({ value: cat, label }) => {
              const active =
                filters.categories?.includes(cat);

              return (
                <motion.button
                  key={cat}

                  whileHover={{
                    y: -3,
                  }}

                  whileTap={{
                    scale: 0.95,
                  }}

                  onClick={() =>
                    toggleCategory(cat)
                  }

                  className={`px-4 py-3 rounded-2xl text-sm font-semibold capitalize transition-all duration-300 ${active
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
                      : "bg-white/80 border border-gray-100 text-gray-700 hover:border-indigo-200 shadow-sm"
                    }`}
                >
                  {label}
                </motion.button>
              );
            })}

          </div>

        </div>

        {/* PRICE */}
        <div className="mt-8">

          <div className="flex items-center justify-between mb-4">

            <p className="text-sm font-semibold text-gray-700">
              Maximum Price
            </p>

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}

              transition={{
                repeat: Infinity,
                duration: 2,
              }}

              className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-bold shadow-md"
            >
              ₹{localPrice}
            </motion.div>

          </div>

          {/* RANGE CONTAINER */}
          <div className="relative rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl px-4 py-5 shadow-lg">

            <input
              type="range"

              min="0"

              max="75000"

              value={localPrice}

              onChange={(e) =>
                setLocalPrice(e.target.value)
              }

              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>₹0</span>

              <span>₹75K</span>
            </div>

          </div>

        </div>

        {/* APPLY BUTTON */}
        <motion.button
          whileHover={{
            scale: 1.02,
            y: -2,
          }}

          whileTap={{
            scale: 0.96,
          }}

          onClick={handleApply}

          className="relative mt-10 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-sm font-bold text-white shadow-[0_15px_40px_rgba(107,68,48,0.35)]"
        >

          {/* MOVING SHINE */}
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}

            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "linear",
            }}

            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          <span className="relative z-10">
            Apply Filters
          </span>

        </motion.button>

      </div>

    </motion.aside>
  );
};

export default FiltersSidebar;