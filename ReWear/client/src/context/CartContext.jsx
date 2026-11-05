import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCartKey } from "../utils/cart";

const CartContext = createContext();

const storageKey = (userId) => `rewear-cart:${userId || "guest"}`;

const loadCart = (userId) => {
  try {
    const items = JSON.parse(localStorage.getItem(storageKey(userId)));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

// Only what the bag and checkout need (the server re-checks prices anyway)
const FIELDS = ["_id", "title", "category", "size", "condition", "price", "rent", "mode", "total", "rentStart", "rentEnd", "quantity", "offerId"];

const saveCart = (userId, items) => {
  try {
    const slim = items.map((item) => ({
      ...Object.fromEntries(FIELDS.filter((k) => item[k] !== undefined).map((k) => [k, item[k]])),
      images: item.images?.slice(0, 1),
    }));
    localStorage.setItem(storageKey(userId), JSON.stringify(slim));
  } catch {
    // Storage full or blocked: the bag still works for this visit
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Each account (and logged-out visitors) has its own bag, kept across page reloads
  const [cartItems, setCartItems] = useState(() => loadCart(user?._id));

  // Switch to the other person's bag when a different user logs in or out
  const [owner, setOwner] = useState(user?._id);

  if (owner !== user?._id) {
    setOwner(user?._id);
    setCartItems(loadCart(user?._id));
  }

  useEffect(() => {
    saveCart(owner, cartItems);
  }, [owner, cartItems]);

  // GET SAFE ID (product + buy/rent + dates)
  const getItemId = getCartKey;

  // ADD TO CART
  // Each listing is one physical item: adding it again (e.g. with new rental
  // dates or buy instead of rent) replaces the existing line.
  // Returns "added" or "updated".
  const addToCart = (product) => {
    const productId = product._id || product.id;

    const exists = cartItems.some(
      (item) =>
        (item._id || item.id) === productId
    );

    setCartItems((prev) => [
      ...prev.filter(
        (item) =>
          (item._id || item.id) !== productId
      ),
      {
        ...product,
        quantity: 1,
      },
    ]);

    return exists ? "updated" : "added";
  };

  // REMOVE
  const removeFromCart = (id) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          getItemId(item) !== id
      )
    );
  };

  // UPDATE QUANTITY
  const updateQuantity = (id, type) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (
          getItemId(item) !== id
        ) {
          return item;
        }

        // Second-hand items are one of a kind, so never more than 1
        if (type === "inc") {
          return item;
        }

        if (
          type === "dec" &&
          item.quantity > 1
        ) {
          return {
            ...item,
            quantity:
              item.quantity - 1,
          };
        }

        return item;
      })
    );
  };

  // CLEAR
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context =
    useContext(CartContext);

  // SAFETY FALLBACK
  if (!context) {
    return {
      cartItems: [],
      addToCart: () => { },
      removeFromCart: () => { },
      updateQuantity: () => { },
      clearCart: () => { },
    };
  }

  return context;
};