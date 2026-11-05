import { motion } from "framer-motion";

import {
  Search,
  Mic,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const ExploreHeader = ({
  mode,
  setMode,
  search,
  setSearch,
}) => {
  return (
    <section className="relative w-full overflow-hidden rounded-[36px] border border-white/40 bg-gradient-to-br from-[#faf6ef] via-[#f8f1e7] to-[#efe3d6] p-6 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.06)]">

      {/* BACKGROUND BLOBS */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}

        transition={{
          repeat: Infinity,
          duration: 8,
        }}

        className="absolute top-[-80px] right-[-60px] w-[220px] h-[220px] rounded-full bg-indigo-300/20 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -20, 0],
          y: [0, 15, 0],
        }}

        transition={{
          repeat: Infinity,
          duration: 10,
        }}

        className="absolute bottom-[-80px] left-[-60px] w-[240px] h-[240px] rounded-full bg-pink-300/20 blur-3xl"
      />

      {/* CONTENT */}
      <div className="relative z-10">

        {/* TOP */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10">

          {/* LEFT */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.7,
            }}

            className="max-w-2xl"
          >

            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/70 backdrop-blur-xl shadow-sm mb-6">

              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                }}

                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}

                className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
              />

              <span className="text-sm font-semibold text-gray-700">
                Fashion Discovery
              </span>

            </div>

            {/* TITLE */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#2b1d14] leading-[1.05]">

              Find Your Next

              <br />

              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Statement Fit.
              </span>

            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-8 max-w-xl">
              Buy forever or rent for moments —
              discover curated fashion without overpaying.
            </p>

            {/* TRENDING TAGS */}
            <div className="mt-8 flex flex-wrap gap-3">

              {[
                "Wedding",
                "Streetwear",
                "Luxury",
                "Y2K",
                "Trending",
              ].map((tag, i) => (
                <motion.div
                  key={tag}

                  animate={{
                    y: [0, -6, 0],
                  }}

                  transition={{
                    repeat: Infinity,
                    duration: 3 + i,
                  }}

                  className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white shadow-sm text-sm font-semibold text-gray-700"
                >
                  {tag}
                </motion.div>
              ))}

            </div>

          </motion.div>

          {/* TOGGLE */}
          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              delay: 0.2,
              duration: 0.7,
            }}

            className="relative flex items-center rounded-full bg-white/70 backdrop-blur-xl border border-white shadow-xl p-2 overflow-hidden w-full sm:w-fit"
          >

            {/* ACTIVE INDICATOR */}
            <motion.div
              layout

              transition={{
                type: "spring",
                stiffness: 250,
                damping: 20,
              }}

              className={`absolute top-2 bottom-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg ${mode === "sale"
                  ? "left-2 right-1/2"
                  : "left-1/2 right-2"
                }`}
            />

            {/* SALE */}
            <button
              onClick={() => setMode("sale")}

              className={`relative z-10 flex-1 sm:flex-none px-6 lg:px-8 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${mode === "sale"
                  ? "text-white"
                  : "text-gray-600"
                }`}
            >
              BUY FOREVER
            </button>

            {/* RENT */}
            <button
              onClick={() => setMode("rent")}

              className={`relative z-10 flex-1 sm:flex-none px-6 lg:px-8 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${mode === "rent"
                  ? "text-white"
                  : "text-gray-600"
                }`}
            >
              RENT FOR EVENTS
            </button>

          </motion.div>

        </div>

        {/* SEARCH SECTION */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            delay: 0.3,
            duration: 0.7,
          }}

          className="mt-10 flex flex-col lg:flex-row gap-5 lg:items-center"
        >

          {/* SEARCH */}
          <div className="relative flex-1">

            {/* SPOTLIGHT */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl" />

            <div className="relative flex items-center rounded-full border border-white/40 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">

              {/* SEARCH ICON */}
              <div className="pl-5 text-gray-400">
                <Search size={20} />
              </div>

              {/* INPUT */}
              <input
                value={search}

                onChange={(e) =>
                  setSearch(e.target.value)
                }

                placeholder="Search outfits, brands, aesthetics..."

                className="w-full px-4 py-4 bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none text-sm sm:text-base"
              />

              {/* MIC */}
              <motion.button
                whileHover={{
                  scale: 1.08,
                }}

                whileTap={{
                  scale: 0.94,
                }}

                className="mr-3 w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg"
              >
                <Mic size={18} />
              </motion.button>

            </div>

          </div>

          {/* QUICK ACTION */}
          <motion.button
            whileHover={{
              y: -3,
              scale: 1.03,
            }}

            whileTap={{
              scale: 0.96,
            }}

            className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-all duration-300"
          >

            Trending Now

            <motion.div
              whileHover={{
                x: 3,
              }}
            >
              <ArrowRight size={18} />
            </motion.div>

          </motion.button>

        </motion.div>

      </div>
    </section>
  );
};

export default ExploreHeader;