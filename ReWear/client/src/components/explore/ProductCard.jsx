import { useNavigate } from "react-router-dom";

import { useWishlist } from "../../context/WishListContext";

import { motion } from "framer-motion";

import {
  Heart,
  Star,
  ArrowUpRight,
} from "lucide-react";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const { wishlist, toggleWishlist } =
    useWishlist();

  const isWishlisted = wishlist.some(
    (p) => p._id === product._id
  );

  const image =
    product?.images &&
      product.images.length > 0
      ? product.images[0]
      : "https://via.placeholder.com/300x400?text=No+Image";

  // FAKE RATING
  const getRandomRating = (id) => {
    const seed = id?.slice(-2) || "10";

    return (
      3 +
      (parseInt(seed, 16) % 20) / 10
    ).toFixed(1);
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{ once: true }}

      transition={{
        duration: 0.6,
      }}

      whileHover={{
        y: -10,
      }}

      onClick={() =>
        navigate(`/product/${product._id}`)
      }

      className="group relative overflow-hidden rounded-[30px] border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] cursor-pointer"
    >

      {/* GLOW */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl z-0" />

      {/* IMAGE SECTION */}
      <div className="relative overflow-hidden aspect-[4/5] bg-gray-100">

        {/* IMAGE */}
        <motion.img
          whileHover={{
            scale: 1.08,
          }}

          transition={{
            duration: 0.6,
          }}

          src={image}

          alt={product.title}

          className="w-full h-full object-cover"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

        {/* SHINE EFFECT */}
        <motion.div
          animate={{
            x: ["-120%", "120%"],
          }}

          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}

          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12"
        />

        {/* MODE BADGE */}
        <div className="absolute top-4 left-4">

          <motion.div
            whileHover={{
              scale: 1.05,
            }}

            className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white text-xs font-bold shadow-lg"
          >
            {product.mode === "both"
              ? "Both Available"
              : product.mode === "rent"
                ? "For Rent"
                : "For Sale"}
          </motion.div>

        </div>

        {/* WISHLIST */}
        <motion.button
          whileHover={{
            scale: 1.12,
          }}

          whileTap={{
            scale: 0.92,
          }}

          onClick={(e) => {
            e.stopPropagation();

            toggleWishlist(product);
          }}

          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg"
        >

          <Heart
            size={18}

            className={`transition ${isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-white"
              }`}
          />

        </motion.button>

        {/* QUICK VIEW */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}

          whileHover={{
            opacity: 1,
            y: 0,
          }}

          className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-xl"
        >
          <ArrowUpRight size={18} />
        </motion.div>

      </div>

      {/* DETAILS */}
      <div className="relative z-10 p-5 sm:p-6">

        {/* TOP ROW */}
        <div className="flex items-start justify-between gap-3">

          <div className="flex-1 min-w-0">

            {/* TITLE */}
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight line-clamp-1">
              {product.title}
            </h3>

            {/* CATEGORY */}
            <p className="mt-1 text-sm text-gray-500 capitalize">
              {product.category}
            </p>

          </div>

          {/* RATING */}
          <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-600">

            <Star
              size={14}
              className="fill-yellow-400 text-yellow-400"
            />

            {getRandomRating(product._id)}

          </div>

        </div>

        {/* PRICE */}
        <div className="mt-5 flex items-end justify-between">

          <div>

            <p className="text-2xl font-black tracking-tight text-[#2b2545]">

              ₹ {product.price || product.rent}

            </p>

            {product.mode === "rent" && (
              <p className="text-xs text-gray-500 mt-1">
                Per day rental
              </p>
            )}

          </div>

          {/* SIZE */}
          <motion.div
            whileHover={{
              y: -2,
            }}

            className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg"
          >
            {product.size}
          </motion.div>

        </div>

        {/* CONDITION */}
        <div className="mt-5 flex items-center justify-between gap-3">

          <div className="px-4 py-2 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {product.condition ||
              "Good Condition"}
          </div>

          <p className="text-xs text-gray-400">
            Premium Listing
          </p>

        </div>

      </div>

    </motion.div>
  );
};

export default ProductCard;