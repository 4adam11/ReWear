import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

import Landing from "./pages/Landing";
import ScrollToTop from "./components/ui/ScrolltoTop";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary, { NotFound } from "./components/ErrorBoundary";

// Each page is downloaded only when it's first visited, so the home page
// doesn't wait for the calendar, checkout, dashboard, etc.
const Explore = lazy(() => import("./pages/Explore"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const HowItWorks = lazy(() => import("./pages/HowitWorks"));
const Sell = lazy(() => import("./pages/Sell"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/WishList"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SellerListings = lazy(() => import("./pages/SellerListings"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#2b1d14] animate-spin" />
  </div>
);

// Resets the crash screen when the user moves to another page
const PageBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
};

function App() {
  return (
    <Router>

      {/* GLOBAL UI */}
      <ScrollToTop/>

      <MainLayout>
        <PageBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/howitworks" element={<HowItWorks />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 🔒 PROTECTED ROUTES */}
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            }
          />

          {/* Edit an existing listing */}
          <Route
            path="/sell/:id"
            element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/listings"
            element={
              <ProtectedRoute>
                <SellerListings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/orders"
            element={
              <ProtectedRoute>
                <SellerOrders />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />


        </Routes>
        </Suspense>
        </PageBoundary>
      </MainLayout>

    </Router>
  );
}

export default App;