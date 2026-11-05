import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import {
  Heart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { useWishlist } from "../context/WishListContext";

import ProductCard from "../components/explore/ProductCard";

const Wishlist = () => {
  const navigate = useNavigate();

  const { wishlist } =
    useWishlist();

  return (
    <div className="min-h-screen bg-[#faf6ef] py-8 sm:py-10 overflow-hidden">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-[40px] bg-[#2b1d14] px-6 sm:px-10 py-12 sm:py-14 mb-10">

          {/* GLOW */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* LEFT */}
            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-white text-sm">

                <Sparkles size={14} />

                Your Saved Fashion Picks

              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-semibold text-white leading-tight">

                Wishlist
                <br />

                Collection ❤️

              </h1>

              <p className="mt-5 max-w-2xl text-gray-300 leading-8">

                Save the outfits you love and revisit them anytime.
                Your fashion inspiration stays here.

              </p>

            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-start lg:items-end">

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl px-6 py-5">

                <p className="text-sm text-gray-300">
                  Saved Products
                </p>

                <h2 className="mt-2 text-5xl font-semibold text-white">
                  {wishlist.length}
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* EMPTY */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            className="bg-white border border-gray-100 rounded-[40px] py-20 sm:py-24 px-6 text-center shadow-sm"
          >

            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center mx-auto">

              <Heart
                size={40}
                className="text-pink-500"
              />

            </div>

            <h2 className="mt-8 text-3xl font-semibold text-[#2b1d14]">
              Your Wishlist is Empty
            </h2>

            <p className="mt-4 text-gray-500 max-w-md mx-auto leading-7">

              Save your favorite outfits, premium rentals,
              and fashion pieces to revisit later.

            </p>

            <button
              onClick={() =>
                navigate("/explore")
              }

              className="mt-10 inline-flex items-center gap-2 bg-[#2b1d14] text-white px-7 py-4 rounded-2xl font-medium hover:opacity-95 transition"
            >

              Explore Products

              <ArrowRight size={18} />

            </button>

          </motion.div>
        ) : (
          <>
            {/* TOP BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

              <div>

                <h2 className="text-3xl font-semibold text-[#2b1d14]">
                  Saved Products
                </h2>

                <p className="mt-2 text-gray-500">
                  Your curated fashion wishlist.
                </p>

              </div>

              <button
                onClick={() =>
                  navigate("/explore")
                }

                className="inline-flex items-center gap-2 border border-gray-200 bg-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition w-fit"
              >

                Continue Exploring

                <ArrowRight size={16} />

              </button>

            </div>

            {/* GRID */}
            <motion.div
              layout

              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
                gap-6
              "
            >

              {wishlist.map(
                (
                  product,
                  index
                ) => (
                  <motion.div
                    key={
                      product._id ||
                      index
                    }

                    layout

                    initial={{
                      opacity: 0,
                      y: 40,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    transition={{
                      delay:
                        index * 0.04,
                      duration: 0.45,
                    }}
                  >

                    <ProductCard
                      product={
                        product
                      }
                    />

                  </motion.div>
                )
              )}

            </motion.div>
          </>
        )}

      </div>

    </div>
  );
};

export default Wishlist;