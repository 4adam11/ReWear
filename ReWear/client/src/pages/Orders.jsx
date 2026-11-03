import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  Package,
  CircleX,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import { motion } from "framer-motion";

import API from "../utils/api";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";

const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const getUser = () =>
    JSON.parse(
      localStorage.getItem("user")
    );

  // FETCH ORDERS
  useEffect(() => {
    const fetchOrders = async () => {
      const user = getUser();

      if (!user) {
        navigate("/login");

        return;
      }

      try {
        const { data } =
          await axios.get(
            `${API}/orders`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

        setOrders(data);
      } catch (err) {
        console.error(err);

        setError(
          "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // CANCEL (orders stay in your history; bought items go back on sale)
  const handleCancel = async (
    id
  ) => {
    const confirmCancel =
      window.confirm(
        "Cancel this order?"
      );

    if (!confirmCancel) return;

    const user = getUser();

    try {
      const { data } =
        await axios.patch(
          `${API}/orders/${id}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === id
            ? data
            : order
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to cancel order"
      );
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-[#1f3a2e]/20 border-t-[#1f3a2e] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-500">
            Loading orders...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f0] py-8 sm:py-10">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">

          <div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1f3a2e]">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track and manage your
              fashion orders.
            </p>

          </div>

          {/* COUNT */}
          {orders.length > 0 && (
            <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm text-sm text-gray-600 w-fit">

              {orders.length} order
              {orders.length > 1
                ? "s"
                : ""}

            </div>
          )}

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm py-20 px-6 text-center">

            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">

              <ShoppingBag
                size={34}
                className="text-gray-500"
              />

            </div>

            <h2 className="mt-6 text-2xl font-semibold text-[#1f3a2e]">
              No Orders Yet
            </h2>

            <p className="mt-3 text-gray-500 max-w-md mx-auto leading-7">
              Looks like you haven’t
              placed any fashion orders
              yet.
            </p>

            <button
              onClick={() =>
                navigate("/explore")
              }

              className="mt-8 inline-flex items-center gap-2 bg-[#1f3a2e] text-white px-7 py-4 rounded-2xl font-medium hover:opacity-95 transition"
            >
              Start Shopping

              <ArrowRight size={18} />

            </button>

          </div>
        ) : (
          <div className="space-y-5">

            {orders.map(
              (order, index) => {
                const firstItem =
                  order.items?.[0];

                const image =
                  thumb(
                    firstItem?.images?.[0] ||
                    firstItem?.image,
                    300
                  ) ||
                  PLACEHOLDER_IMAGE;

                return (
                  <motion.div
                    key={order._id}

                    initial={{
                      opacity: 0,
                      y: 30,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    transition={{
                      delay:
                        index * 0.05,
                    }}

                    className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition"
                  >

                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">

                      {/* LEFT */}
                      <div className="flex flex-col sm:flex-row gap-5">

                        {/* IMAGE */}
                        <div className="rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">

                          <img
                            src={image}

                            alt={
                              firstItem?.title
                            }

                            className="w-full sm:w-32 h-[220px] sm:h-36 object-cover"
                          />

                        </div>

                        {/* INFO */}
                        <div className="flex flex-col justify-between">

                          <div>

                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${order.status === "cancelled"
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                              }`}>

                              <Package size={14} />

                              {order.status === "cancelled"
                                ? "Cancelled"
                                : "Order Placed"}

                            </div>

                            <h2 className="mt-4 text-2xl font-semibold text-[#1f3a2e]">
                              {firstItem?.title ||
                                "Order"}
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                              Order ID:{" "}

                              <span className="font-medium text-gray-700">
                                #
                                {order._id
                                  .slice(-6)
                                  .toUpperCase()}
                              </span>

                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {order.items
                                ?.length || 0}{" "}
                              item
                              {order.items
                                ?.length > 1
                                ? "s"
                                : ""}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-5">

                        {/* PRICE */}
                        <div className="text-left sm:text-right">

                          <p className="text-sm text-gray-500">
                            Total Amount
                          </p>

                          <h3 className="mt-1 text-3xl font-semibold text-[#1f3a2e]">
                            ₹ {order.total}
                          </h3>

                        </div>

                        {/* ACTION */}
                        {order.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleCancel(
                                order._id
                              )
                            }

                            className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition"
                          >

                            <CircleX size={16} />

                            Cancel Order

                          </button>
                        )}

                      </div>

                    </div>

                  </motion.div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default Orders;