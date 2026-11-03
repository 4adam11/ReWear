import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import axios from "axios";

import { DateRange } from "react-date-range";
import {
  differenceInDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfToday,
  max as maxDate,
} from "date-fns";

import {
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Heart,
} from "lucide-react";

import { motion } from "framer-motion";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import API from "../utils/api";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";

const ProductDetail = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { addToCart } = useCart();

  const [product, setProduct] =
    useState(null);

  const [mode, setMode] =
    useState("rent");

  const [activeImage, setActiveImage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [dateRange, setDateRange] =
    useState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);

  // FETCH
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const { data } =
          await axios.get(
            `${API}/products/${id}`
          );

        setProduct(data);

        // Start on an option this listing actually offers
        setMode(
          data.mode === "sell" ||
            data.mode === "sale"
            ? "sale"
            : "rent"
        );

        setActiveImage(
          data.images?.[0] || ""
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] px-4 py-10">

        <div className="max-w-[1400px] mx-auto">

          <div className="grid lg:grid-cols-2 gap-8">

            <div className="aspect-[4/5] rounded-2xl bg-white animate-pulse" />

            <div className="bg-white rounded-2xl h-[700px] animate-pulse" />

          </div>

        </div>

      </div>
    );
  }

  // NOT FOUND
  if (!product) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center px-4">

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center max-w-md w-full">

          <h2 className="text-2xl font-semibold text-[#1f3a2e]">
            Product not found
          </h2>

          <button
            onClick={() =>
              navigate("/explore")
            }

            className="mt-6 px-6 py-3 rounded-xl bg-[#1f3a2e] text-white font-medium"
          >
            Explore Products
          </button>

        </div>

      </div>
    );
  }

  // RENT CALCULATION
  const start = dateRange[0].startDate;

  const end = dateRange[0].endDate;

  const days = Math.max(
    differenceInDays(end, start) + 1,
    1
  );

  const rentPerDay =
    product.rent || 0;

  const totalRent =
    rentPerDay * days;

  const totalPrice =
    mode === "rent"
      ? totalRent
      : product.price;

  const canBuy =
    ["sell", "sale", "both"].includes(product.mode) &&
    product.price > 0;

  const canRent =
    ["rent", "both"].includes(product.mode) &&
    product.rent > 0;

  const day = (d) => format(d, "yyyy-MM-dd");

  // Days other people have already rented this item
  const bookings = product.bookings || [];

  const bookedDays = bookings.flatMap((b) =>
    eachDayOfInterval({
      start: parseISO(b.start),
      end: parseISO(b.end),
    })
  );

  const clashes = bookings.some(
    (b) => day(start) <= b.end && day(end) >= b.start
  );

  // The seller's availability window (only if they picked a real range)
  const windowStart = product.availability?.startDate
    ? parseISO(product.availability.startDate.slice(0, 10))
    : null;

  const windowEnd = product.availability?.endDate
    ? parseISO(product.availability.endDate.slice(0, 10))
    : null;

  const hasWindow =
    windowStart &&
    windowEnd &&
    differenceInDays(windowEnd, windowStart) >= 1;

  // Why this can't be ordered right now (empty = it can)
  const blockedReason =
    product.status === "sold"
      ? "This item has been sold"
      : mode === "sale" && !canBuy
        ? "This item is only available to rent"
        : mode === "rent" && !canRent
          ? "This item is only available to buy"
          : mode === "rent" && clashes
            ? "Someone has already booked some of these dates"
            : "";

  // The server recalculates the price from these fields
  const cartLine = {
    ...product,
    mode,
    total: totalPrice,
    ...(mode === "rent" && {
      rentStart: day(start),
      rentEnd: day(end),
    }),
  };

  // Only photos uploaded through the checker live in this folder
  const photosChecked =
    product.images?.[0]?.includes(
      "/rewear/products/"
    );

  return (
    <div className="min-h-screen bg-[#f6f5f0] py-8 sm:py-10">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}

          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1f3a2e] transition mb-8"
        >
          <ArrowLeft size={18} />

          Back
        </button>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">

          {/* LEFT */}
          <div>

            {/* MAIN IMAGE */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm"
            >

              <img
                src={
                  thumb(activeImage, 1200) ||
                  PLACEHOLDER_IMAGE
                }

                alt={product.title}

                className="w-full aspect-[4/5] object-cover"
              />

            </motion.div>

            {/* THUMBNAILS */}
            {product.images?.length >
              1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">

                  {product.images.map(
                    (img, i) => (
                      <button
                        key={i}

                        onClick={() =>
                          setActiveImage(img)
                        }

                        className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${activeImage === img
                            ? "border-[#1f3a2e]"
                            : "border-transparent"
                          }`}
                      >

                        <img
                          src={thumb(img, 200)}

                          alt="thumb"

                          loading="lazy"

                          className="w-20 h-24 object-cover"
                        />

                      </button>
                    )
                  )}

                </div>
              )}

          </div>

          {/* RIGHT */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 shadow-sm lg:sticky lg:top-24"
          >

            {/* CATEGORY */}
            <p className="text-sm text-gray-500 capitalize">
              {product.category} • Size{" "}
              {product.size}
            </p>

            {/* TITLE */}
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1f3a2e] leading-tight">
              {product.title}
            </h1>

            {/* META */}
            <div className="flex flex-wrap items-center gap-3 mt-5">

              {/* CONDITION */}
              <div className="px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                {product.condition}
              </div>

              {/* PHOTOS CHECKED BY THE MODERATION MODEL */}
              {photosChecked && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">

                  <ShieldCheck size={16} />

                  Photos checked

                </div>
              )}

              {product.status === "sold" && (
                <div className="px-3 py-1.5 rounded-full bg-red-50 text-sm font-medium text-red-600">
                  Sold
                </div>
              )}

            </div>

            {/* PRICE */}
            <div className="mt-8">

              {mode === "sale" ? (
                <div>

                  <p className="text-sm text-gray-500">
                    Purchase Price
                  </p>

                  <h2 className="mt-1 text-4xl font-semibold text-[#1f3a2e]">
                    ₹ {product.price}
                  </h2>

                </div>
              ) : (
                <div>

                  <p className="text-sm text-gray-500">
                    Rental Price
                  </p>

                  <h2 className="mt-1 text-4xl font-semibold text-[#1f3a2e]">
                    ₹ {rentPerDay}

                    <span className="text-lg text-gray-500 font-medium">
                      {" "}
                      / day
                    </span>

                  </h2>

                </div>
              )}

            </div>

            {/* MODE TOGGLE */}
            <div className="mt-8 flex rounded-2xl bg-gray-100 p-1">

              <button
                onClick={() =>
                  setMode("sale")
                }

                disabled={!canBuy}

                className={`flex-1 py-3 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${mode === "sale"
                    ? "bg-white text-[#1f3a2e] shadow-sm"
                    : "text-gray-500"
                  }`}
              >
                Buy
              </button>

              <button
                onClick={() =>
                  setMode("rent")
                }

                disabled={!canRent}

                className={`flex-1 py-3 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${mode === "rent"
                    ? "bg-[#1f3a2e] text-white"
                    : "text-gray-500"
                  }`}
              >
                Rent
              </button>

            </div>

            {/* RENTAL */}
            {mode === "rent" && (
              <div className="mt-8">

                <div className="border border-gray-200 rounded-2xl overflow-hidden">

                  <DateRange
                    ranges={dateRange}

                    onChange={(item) =>
                      setDateRange([
                        item.selection,
                      ])
                    }

                    moveRangeOnFirstSelection={
                      false
                    }

                    minDate={
                      hasWindow
                        ? maxDate([startOfToday(), windowStart])
                        : startOfToday()
                    }

                    maxDate={
                      hasWindow
                        ? windowEnd
                        : undefined
                    }

                    disabledDates={bookedDays}
                  />

                </div>

                {/* TOTAL */}
                <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">

                  <span className="text-sm text-gray-500">
                    {days} day
                    {days > 1
                      ? "s"
                      : ""}
                  </span>

                  <span className="text-lg font-semibold text-[#1f3a2e]">
                    ₹ {totalRent}
                  </span>

                </div>

              </div>
            )}

            {/* DESCRIPTION */}
            <div className="mt-8">

              <h3 className="text-lg font-semibold text-[#1f3a2e]">
                Product Details
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                {product.description ||
                  "Pre-loved fashion piece listed by a ReWear seller. Check the photos, size and condition before ordering."}
              </p>

            </div>

            {/* WHY IT CAN'T BE ORDERED */}
            {blockedReason && (
              <p className="mt-10 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                {blockedReason}
              </p>
            )}

            {/* ACTIONS */}
            <div className={`${blockedReason ? "mt-4" : "mt-10"} flex flex-col sm:flex-row gap-4`}>

              {/* ADD TO CART */}
              <button
                onClick={() => {
                  alert(
                    addToCart(cartLine) === "updated"
                      ? "Your cart has been updated"
                      : "Added to cart"
                  );
                }}

                disabled={!!blockedReason}

                className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-[#1f3a2e] py-4 rounded-xl font-medium hover:border-[#1f3a2e] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <ShoppingBag size={18} />

                Add to Cart

              </button>

              {/* BUY NOW */}
              <button
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      items: [cartLine],
                    },
                  })
                }

                disabled={!!blockedReason}

                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1f3a2e] text-white py-4 rounded-xl font-medium hover:opacity-95 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <Heart size={18} />

                {mode === "rent"
                  ? "Rent Now"
                  : "Buy Now"}

              </button>

            </div>

          </motion.div>

        </div>

      </div>

    </div>
  );
};

export default ProductDetail;