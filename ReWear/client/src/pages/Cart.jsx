import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ShoppingBag, Trash2 } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishListContext";
import { getItemPrice, getCartKey } from "../utils/cart";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import { categoryLabel } from "../utils/catalog";
import { money } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";

const Cart = () => {
  usePageTitle("Your bag");
  const navigate = useNavigate();
  const { cartItems = [], removeFromCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const total = cartItems.reduce((acc, item) => acc + getItemPrice(item), 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShoppingBag size={32} className="mx-auto text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.04em]">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted">Items you add to your bag will show up here.</p>
        <Link to="/explore" className="btn btn-dark mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-baseline gap-x-3 mb-5">
        <h1 className="page-title">Your bag</h1>
        <span className="text-sm text-muted">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <ul className="bg-white border border-line rounded-sm divide-y divide-[#efe6da]">
          {cartItems.map((item) => {
            const key = getCartKey(item);
            const saved = wishlist.some((p) => p._id === item._id);

            return (
              <li key={key} className="p-4 sm:p-5 flex gap-4">
                <Link to={`/product/${item._id}`} className="flex-shrink-0">
                  <img
                    src={thumb(item.image || item.images?.[0], 240) || PLACEHOLDER_IMAGE}
                    alt={item.title}
                    className="w-20 h-[100px] sm:w-24 sm:h-[120px] rounded-md object-cover bg-cream border border-line"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-3">
                    <Link to={`/product/${item._id}`} className="text-[15px] font-semibold hover:text-brand line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-[15px] font-bold whitespace-nowrap">{money(getItemPrice(item))}</p>
                  </div>

                  <p className="mt-1 text-[13px] text-muted">
                    {categoryLabel(item.category)} · Size {item.size}
                    {item.condition ? ` · ${item.condition}` : ""}
                  </p>
                  <p className="mt-1 text-[13px]">
                    {item.mode === "rent" && item.rentStart ? (
                      <>
                        <span className="font-semibold">Rental</span> · {format(parseISO(item.rentStart), "d MMM")} – {format(parseISO(item.rentEnd), "d MMM yyyy")}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Purchase</span> · one of a kind
                      </>
                    )}
                  </p>

                  <div className="mt-auto pt-3 flex flex-wrap gap-4 text-[13px] font-semibold">
                    <button type="button" onClick={() => removeFromCart(key)} className="inline-flex items-center gap-1.5 text-muted hover:text-red-700">
                      <Trash2 size={14} />
                      Remove
                    </button>
                    {!saved && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleWishlist(item);
                          removeFromCart(key);
                        }}
                        className="text-brand hover:underline"
                      >
                        Move to wishlist
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="bg-white border border-line rounded-sm p-5 lg:sticky lg:top-32 flex flex-col gap-4">
          <h2 className="text-base font-bold">Price details</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items ({cartItems.length})</dt>
              <dd>{money(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-[#efe6da] pt-3 mt-1">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => navigate("/checkout", { state: { items: cartItems } })}
            className="btn btn-dark h-12"
          >
            Proceed to checkout
          </button>
          <p className="text-xs text-muted">Promo codes can be applied at checkout.</p>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
