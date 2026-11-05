import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Truck,
  Tag,
  ShieldCheck,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getItemPrice, toOrderItems } from "../utils/cart";

import API from "../utils/api";

const Checkout = () => {
  const { state } = useLocation();

  const navigate = useNavigate();

  const { clearCart } = useCart();

  const { user } = useAuth();

  // Hooks must run before any early return
  const items = state?.items || [];

  const [promo, setPromo] = useState("");

  const [appliedPromo, setAppliedPromo] =
    useState("");

  const [quote, setQuote] = useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("card");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const authHeader = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  // ASK THE SERVER FOR THE REAL TOTAL
  const fetchQuote = (promoCode) =>
    axios.post(
      `${API}/orders/quote`,
      {
        items: toOrderItems(items),
        promoCode,
      },
      authHeader
    );

  useEffect(() => {
    if (!items.length || !user) return;

    fetchQuote(appliedPromo)
      .then(({ data }) => setQuote(data))
      .catch((err) =>
        setError(
          err.response?.data?.message ||
          "Could not calculate total"
        )
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user, appliedPromo]);

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#faf6ef] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center max-w-md w-full">
          <h2 className="text-2xl font-semibold text-[#2b1d14]">
            No checkout data found
          </h2>

          <p className="mt-3 text-gray-500 text-sm">
            Your cart seems empty.
          </p>

          <button
            onClick={() => navigate("/explore")}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md hover:opacity-90 transition"
          >
            Explore Products
          </button>
        </div>
      </div>
    );
  }

  // TOTAL (local estimate until the server quote arrives)
  const estimate = items.reduce(
    (acc, item) =>
      acc +
      getItemPrice(item) *
      (item.quantity || 1),
    0
  );

  const discount = quote?.discount || 0;

  const finalAmount =
    quote?.total ?? estimate;

  // APPLY PROMO (validated by the server)
  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();

    try {
      const { data } = await fetchQuote(code);

      if (!data.promoValid) {
        alert("Invalid Promo Code");
        setAppliedPromo("");
        return;
      }

      setAppliedPromo(code);
      setQuote(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not apply promo code"
      );
    }
  };

  // PAYMENT
  const handlePayment = async () => {
    if (!user) {
      alert("Please login first");

      navigate("/login");

      return;
    }

    if (
      !address.name ||
      !address.phone ||
      !address.address
    ) {
      setError(
        "Please fill all address fields"
      );

      return;
    }

    if (!window.confirm("Confirm Order?"))
      return;

    try {
      setLoading(true);

      // No total sent: the server prices the order itself
      await axios.post(
        `${API}/orders`,
        {
          items: toOrderItems(items),
          promoCode: appliedPromo,
          paymentMethod,
          address,
        },
        authHeader
      );

      clearCart();

      navigate("/success");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6ef] py-8 sm:py-10">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">

          {/* BACK */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {/* TITLE */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#2b1d14]">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Complete your order securely
            </p>
          </div>

          {/* TRUST */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
            <ShieldCheck
              size={18}
              className="text-green-500"
            />

            Secure Checkout
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-[1.5fr_0.8fr] gap-8 items-start">

          {/* LEFT */}
          <div className="space-y-6">

            {/* ITEMS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

              <h2 className="text-xl font-semibold text-[#2b1d14] mb-6">
                Order Items
              </h2>

              <div className="space-y-4">

                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-2xl p-4"
                  >

                    {/* IMAGE */}
                    <img
                      src={
                        item.image ||
                        item.images?.[0]
                      }

                      alt={item.title}

                      className="w-full sm:w-28 h-[220px] sm:h-32 rounded-xl object-cover bg-gray-100"
                    />

                    {/* DETAILS */}
                    <div className="flex-1 flex flex-col justify-between">

                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 capitalize">
                          {item.category}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-5">

                        <div className="text-sm text-gray-500">
                          Qty:{" "}
                          {item.quantity || 1}
                        </div>

                        <div className="text-xl font-semibold text-[#2b1d14]">
                          ₹{" "}
                          {getItemPrice(item) *
                            (item.quantity || 1)}
                        </div>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* ADDRESS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

              <h2 className="text-xl font-semibold text-[#2b1d14] mb-6">
                Shipping Address
              </h2>

              <div className="space-y-4">

                <input
                  type="text"

                  placeholder="Full Name"

                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

                  onChange={(e) =>
                    setAddress({
                      ...address,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="text"

                  placeholder="Phone Number"

                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

                  onChange={(e) =>
                    setAddress({
                      ...address,
                      phone: e.target.value,
                    })
                  }
                />

                <textarea
                  rows={4}

                  placeholder="Full Address"

                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"

                  onChange={(e) =>
                    setAddress({
                      ...address,
                      address: e.target.value,
                    })
                  }
                />

              </div>

            </div>

            {/* PAYMENT */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

              <h2 className="text-xl font-semibold text-[#2b1d14] mb-6">
                Payment Method
              </h2>

              <div className="grid sm:grid-cols-3 gap-4">

                {[
                  {
                    id: "card",
                    label: "Card",
                    icon: CreditCard,
                  },

                  {
                    id: "upi",
                    label: "UPI",
                    icon: Wallet,
                  },

                  {
                    id: "cod",
                    label: "Cash on Delivery",
                    icon: Truck,
                  },
                ].map((method) => {
                  const Icon = method.icon;

                  const active =
                    paymentMethod === method.id;

                  return (
                    <button
                      key={method.id}

                      onClick={() =>
                        setPaymentMethod(
                          method.id
                        )
                      }

                      className={`border rounded-2xl p-5 text-left transition ${active
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                        }`}
                    >

                      <Icon
                        size={24}
                        className={
                          active
                            ? "text-indigo-600"
                            : "text-gray-600"
                        }
                      />

                      <p className="mt-4 text-sm font-medium text-gray-800">
                        {method.label}
                      </p>

                    </button>
                  );
                })}

              </div>

            </div>

            {/* PROMO */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

              <div className="flex items-center gap-2 mb-5">

                <Tag
                  size={20}
                  className="text-indigo-500"
                />

                <h2 className="text-xl font-semibold text-[#2b1d14]">
                  Promo Code
                </h2>

              </div>

              <div className="flex flex-col sm:flex-row gap-4">

                <input
                  value={promo}

                  onChange={(e) =>
                    setPromo(e.target.value)
                  }

                  placeholder="Enter promo code"

                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={applyPromo}

                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-md hover:opacity-90 transition"
                >
                  Apply
                </button>

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="xl:sticky xl:top-24">

            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

              <h2 className="text-2xl font-semibold text-[#2b1d14]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >

                    <span className="text-gray-600">
                      {item.title}
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{" "}
                      {getItemPrice(item) *
                        (item.quantity || 1)}
                    </span>

                  </div>
                ))}

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600 font-medium">

                    <span>Discount</span>

                    <span>-₹ {discount}</span>

                  </div>
                )}

              </div>

              <div className="my-6 border-t border-gray-100"></div>

              <div className="flex items-center justify-between">

                <span className="text-lg font-medium text-gray-600">
                  Total
                </span>

                <span className="text-3xl font-semibold text-[#2b1d14]">
                  ₹ {finalAmount}
                </span>

              </div>

              <button
                disabled={loading}

                onClick={handlePayment}

                className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-medium shadow-md hover:opacity-90 transition disabled:opacity-60"
              >
                {loading
                  ? "Processing..."
                  : `Pay ₹ ${finalAmount}`}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Checkout;