import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Package,
  ShoppingBag,
  Wallet,
  Trash2,
  Pencil,
  ArrowRight,
  Plus,
} from "lucide-react";

import { motion } from "framer-motion";

import API from "../utils/api";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";

const Dashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [sales, setSales] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // USER
  const stored = JSON.parse(
    localStorage.getItem("user")
  );

  const userId =
    stored?._id ||
    stored?.user?._id;

  const token = stored?.token;

  // LOGIN CHECK
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [
          productRes,
          orderRes,
          salesRes,
        ] = await Promise.all([
          // Only your own listings (not every product on the site)
          axios.get(
            `${API}/products/mine`,
            config
          ),

          axios.get(
            `${API}/orders`,
            config
          ),

          axios.get(
            `${API}/orders/sales`,
            config
          ),
        ]);

        // PRODUCTS
        const myProducts =
          productRes.data;

        // ORDERS
        const myOrders =
          orderRes.data.filter(
            (o) => {
              const uid =
                typeof o.user ===
                  "object"
                  ? o.user?._id
                  : o.user;

              return (
                String(uid) ===
                String(userId)
              );
            }
          );

        setProducts(myProducts);
        setOrders(myOrders);
        setSales(salesRes.data);
      } catch (err) {
        console.error(
          "Dashboard error:",
          err
        );

        if (
          err.response?.status ===
          401
        ) {
          localStorage.removeItem(
            "user"
          );

          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && userId) {
      fetchData();
    }
  }, [
    token,
    userId,
    navigate,
  ]);

  // DELETE
  const handleDelete = async (
    id
  ) => {
    const confirmDelete =
      window.confirm(
        "Delete this product?"
      );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API}/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProducts((prev) =>
        prev.filter(
          (p) => p._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete error:",
        err.response?.data ||
        err.message
      );

      alert(
        err.response?.data?.message ||
        "Delete failed"
      );
    }
  };

  // EDIT
  const handleEdit = (
    product
  ) => {
    const newTitle = prompt(
      "Edit product title",
      product.title
    );

    if (!newTitle) return;

    axios
      .put(
        `${API}/products/${product._id}`,
        {
          title: newTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      .then(() => {
        setProducts((prev) =>
          prev.map((p) =>
            p._id ===
              product._id
              ? {
                ...p,
                title: newTitle,
              }
              : p
          )
        );
      })

      .catch((err) => {
        console.error(err);

        alert("Update failed");
      });
  };

  // STATS
  const totalProducts =
    products.length;

  const totalOrders =
    orders.length;

  // Money from other people buying/renting your listings
  // (not what you spent on your own orders)
  const totalEarnings =
    sales.reduce((acc, s) => {
      return (
        acc + (s.earnings || 0)
      );
    }, 0);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-[#1f3a2e]/20 border-t-[#1f3a2e] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-500">
            Loading dashboard...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f0] py-8 sm:py-10">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1f3a2e]">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Welcome back,{" "}
              {stored?.name}
            </p>

          </div>

          <button
            onClick={() =>
              navigate("/sell")
            }

            className="inline-flex items-center gap-2 bg-[#1f3a2e] text-white px-6 py-4 rounded-2xl font-medium hover:opacity-95 transition w-fit"
          >

            <Plus size={18} />

            List Product

          </button>

        </div>

        {/* STATS */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* PRODUCTS */}
          <motion.div
            whileHover={{
              y: -4,
            }}

            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Products Listed
                </p>

                <h2 className="mt-3 text-4xl font-semibold text-[#1f3a2e]">
                  {totalProducts}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">

                <Package className="text-indigo-600" />

              </div>

            </div>

          </motion.div>

          {/* ORDERS */}
          <motion.div
            whileHover={{
              y: -4,
            }}

            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Orders
                </p>

                <h2 className="mt-3 text-4xl font-semibold text-[#1f3a2e]">
                  {totalOrders}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center">

                <ShoppingBag className="text-pink-500" />

              </div>

            </div>

          </motion.div>

          {/* EARNINGS */}
          <motion.div
            whileHover={{
              y: -4,
            }}

            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Earnings
                </p>

                <h2 className="mt-3 text-4xl font-semibold text-[#1f3a2e]">
                  ₹ {totalEarnings}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">

                <Wallet className="text-green-600" />

              </div>

            </div>

          </motion.div>

        </div>

        {/* MY LISTINGS */}
        <div>

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-semibold text-[#1f3a2e]">
              My Listings
            </h2>

            {products.length >
              0 && (
                <div className="text-sm text-gray-500">
                  {
                    products.length
                  }{" "}
                  products
                </div>
              )}

          </div>

          {products.length ===
            0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl py-20 px-6 text-center shadow-sm">

              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">

                <Package className="text-gray-500" />

              </div>

              <h3 className="mt-6 text-2xl font-semibold text-[#1f3a2e]">
                No Products Listed
              </h3>

              <p className="mt-3 text-gray-500">
                Start selling your
                fashion products on
                ReWear.
              </p>

              <button
                onClick={() =>
                  navigate("/sell")
                }

                className="mt-8 inline-flex items-center gap-2 bg-[#1f3a2e] text-white px-6 py-4 rounded-2xl font-medium"
              >
                Start Selling

                <ArrowRight size={18} />

              </button>

            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">

              {products.map((p) => (
                <motion.div
                  key={p._id}

                  whileHover={{
                    y: -6,
                  }}

                  className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
                >

                  {/* IMAGE */}
                  <div className="relative overflow-hidden">

                    <img
                      src={
                        thumb(p.images?.[0]) ||
                        PLACEHOLDER_IMAGE
                      }

                      alt={p.title}

                      loading="lazy"

                      decoding="async"

                      className="h-[320px] w-full object-cover hover:scale-105 transition duration-500"
                    />

                    {/* BADGE */}
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-[#1f3a2e]">

                      {p.status === "sold"
                        ? "Sold"
                        : p.mode ===
                          "rent"
                          ? "For Rent"
                          : p.mode ===
                            "both"
                            ? "Rent + Sale"
                            : "For Sale"}

                    </div>

                  </div>

                  {/* CONTENT */}
                  <div className="p-5">

                    <h3 className="text-xl font-semibold text-[#1f3a2e] line-clamp-1">
                      {p.title}
                    </h3>

                    <p className="mt-2 text-gray-500 capitalize">
                      {p.category}
                    </p>

                    <div className="mt-5 flex items-center justify-between">

                      <div>

                        <p className="text-sm text-gray-500">
                          Price
                        </p>

                        <h4 className="text-2xl font-semibold text-[#1f3a2e]">
                          ₹{" "}
                          {p.price ||
                            p.rent}
                        </h4>

                      </div>

                      <div className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {p.condition}
                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 flex items-center gap-3">

                      <button
                        onClick={() =>
                          handleEdit(
                            p
                          )
                        }

                        className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                      >

                        <Pencil size={15} />

                        Edit

                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            p._id
                          )
                        }

                        className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                      >

                        <Trash2 size={15} />

                        Delete

                      </button>

                    </div>

                  </div>

                </motion.div>
              ))}

            </div>
          )}

        </div>

        {/* ORDERS */}
        <div>

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-semibold text-[#1f3a2e]">
              Recent Orders
            </h2>

            {orders.length > 0 && (
              <div className="text-sm text-gray-500">
                {
                  orders.length
                }{" "}
                orders
              </div>
            )}

          </div>

          {orders.length ===
            0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl py-16 px-6 text-center shadow-sm">

              <ShoppingBag className="mx-auto text-gray-400" size={42} />

              <h3 className="mt-5 text-xl font-semibold text-[#1f3a2e]">
                No Orders Yet
              </h3>

              <p className="mt-2 text-gray-500">
                Orders will appear
                here after purchases.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {orders.map((o) => {
                const firstItem =
                  o.items?.[0];

                return (
                  <div
                    key={o._id}

                    className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                  >

                    {/* LEFT */}
                    <div className="flex items-center gap-4">

                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">

                        <img
                          src={
                            thumb(firstItem?.images?.[0] || firstItem?.image, 200) ||
                            PLACEHOLDER_IMAGE
                          }

                          alt={
                            firstItem?.title
                          }

                          className="w-full h-full object-cover"
                        />

                      </div>

                      <div>

                        <h3 className="text-lg font-semibold text-[#1f3a2e]">
                          {firstItem?.title ||
                            "Order"}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Order ID: #
                          {o._id
                            .slice(-6)
                            .toUpperCase()}
                        </p>

                      </div>

                    </div>

                    {/* RIGHT */}
                    <div className="text-left sm:text-right">

                      <p className="text-sm text-gray-500">
                        Total
                      </p>

                      <h3 className="mt-1 text-2xl font-semibold text-[#1f3a2e]">
                        ₹ {o.total}
                      </h3>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Dashboard;