import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { useWishlist } from "../context/WishListContext";
import ProductCard from "../components/explore/ProductCard";
import usePageTitle from "../hooks/usePageTitle";

const Wishlist = () => {
  usePageTitle("Wishlist");
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-5">
        <h1 className="page-title">Wishlist</h1>
        <span className="text-sm text-muted">
          {wishlist.length} saved item{wishlist.length === 1 ? "" : "s"}
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d9cbb9] bg-white py-16 px-6 text-center">
          <Heart className="mx-auto text-muted" size={28} />
          <p className="mt-3 font-semibold">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted">Tap the heart on any item to keep it here for later.</p>
          <Link
            to="/explore"
            className="btn btn-dark btn-sm mt-4"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {wishlist.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
