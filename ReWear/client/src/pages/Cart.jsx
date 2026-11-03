import { useCart } from "../context/CartContext";
import { getItemPrice, getCartKey } from "../utils/cart";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Trash2,
  ShoppingBag,
} from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();

  const cart = useCart();

  const cartItems = cart?.cartItems || [];

  const removeFromCart =
    cart?.removeFromCart || (() => { });


  // TOTAL
  const total = cartItems.reduce(
    (acc, item) =>
      acc +
      getItemPrice(item) *
      (item.quantity || 1),
    0
  );

  return (
    <div className="min-h-screen bg-[#f6f5f0] py-8 sm:py-10">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">

          {/* BACK */}
          <button
            onClick={() => navigate(-1)}

            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1f3a2e] transition"
          >
            <ArrowLeft size={18} />

            Continue Shopping
          </button>

          {/* TITLE */}
          <div className="text-center">

            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1f3a2e]">
              Your Cart
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {cartItems.length} item
              {cartItems.length !== 1
                ? "s"
                : ""}{" "}
              in your bag
            </p>

          </div>

          {/* SPACER */}
          <div className="hidden sm:block w-[140px]" />

        </div>

        {/* EMPTY */}
        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-20 px-6 text-center">

            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">

              <ShoppingBag
                size={28}
                className="text-gray-500"
              />

            </div>

            <h2 className="mt-6 text-2xl font-semibold text-[#1f3a2e]">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
              Looks like you haven’t added
              anything yet.
            </p>

            <button
              onClick={() =>
                navigate("/explore")
              }

              className="mt-8 px-6 py-3 rounded-xl bg-[#1f3a2e] text-white font-medium hover:opacity-95 transition"
            >
              Explore Products
            </button>

          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">

            {/* LEFT */}
            <div className="space-y-4">

              {cartItems.map((item, index) => {
                const cartId =
                  getCartKey(item);

                const itemPrice =
                  getItemPrice(item);

                const quantity =
                  item.quantity || 1;

                return (
                  <div
                    key={cartId || index}

                    className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm"
                  >

                    <div className="flex flex-col sm:flex-row gap-5">

                      {/* IMAGE */}
                      <div className="overflow-hidden rounded-xl bg-gray-100 flex-shrink-0">

                        <img
                          src={
                            item.image ||
                            item.images?.[0]
                          }

                          alt={item.title}

                          className="w-full sm:w-32 h-[220px] sm:h-36 object-cover"
                        />

                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 flex flex-col justify-between">

                        <div>

                          {/* TITLE */}
                          <div className="flex items-start justify-between gap-4">

                            <div>

                              <h2 className="text-lg font-medium text-[#1f3a2e]">
                                {item.title}
                              </h2>

                              <p className="mt-1 text-sm text-gray-500 capitalize">
                                {item.category} •{" "}
                                {item.mode}
                              </p>

                            </div>

                            {/* REMOVE */}
                            <button
                              onClick={() =>
                                removeFromCart(
                                  cartId
                                )
                              }

                              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 size={18} />
                            </button>

                          </div>

                          {/* PRICE */}
                          <p className="mt-4 text-2xl font-semibold text-[#1f3a2e]">
                            ₹ {itemPrice}
                          </p>

                        </div>

                        {/* BOTTOM */}
                        <div className="flex items-center justify-between mt-6">

                          {/* ONE OF A KIND (second-hand items have no quantity) */}
                          <div className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                            {item.mode === "rent" && item.rentStart
                              ? `${item.rentStart} → ${item.rentEnd}`
                              : "One of a kind"}
                          </div>

                          {/* TOTAL */}
                          <div className="text-right">

                            <p className="text-sm text-gray-500">
                              Total
                            </p>

                            <p className="text-lg font-semibold text-[#1f3a2e]">
                              ₹{" "}
                              {itemPrice *
                                quantity}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* RIGHT */}
            <div className="lg:sticky lg:top-24">

              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

                <h2 className="text-2xl font-semibold text-[#1f3a2e]">
                  Order Summary
                </h2>

                {/* SUMMARY */}
                <div className="mt-6 space-y-4">

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-500">
                      Items
                    </span>

                    <span className="font-medium text-gray-900">
                      {cartItems.length}
                    </span>

                  </div>

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-500">
                      Delivery
                    </span>

                    <span className="font-medium text-green-600">
                      Free
                    </span>

                  </div>

                </div>

                {/* DIVIDER */}
                <div className="my-6 border-t border-gray-100"></div>

                {/* TOTAL */}
                <div className="flex items-center justify-between">

                  <span className="text-lg font-medium text-gray-600">
                    Total
                  </span>

                  <span className="text-3xl font-semibold text-[#1f3a2e]">
                    ₹ {total}
                  </span>

                </div>

                {/* BUTTON */}
                <button
                  onClick={() =>
                    navigate("/checkout", {
                      state: {
                        items: cartItems,
                      },
                    })
                  }

                  className="w-full mt-8 bg-[#1f3a2e] text-white py-4 rounded-xl font-medium hover:opacity-95 transition shadow-sm"
                >
                  Proceed to Checkout
                </button>

                {/* NOTE */}
                <p className="mt-4 text-xs text-center text-gray-400 leading-6">
                  Taxes and shipping calculated
                  at checkout.
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default Cart;