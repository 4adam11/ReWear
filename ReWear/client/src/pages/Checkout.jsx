import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Banknote, CreditCard, Smartphone, Lock } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getItemPrice, toOrderItems } from "../utils/cart";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import { money } from "../components/explore/ProductCard";
import API from "../utils/api";

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on delivery", note: "Pay the courier when it arrives", icon: Banknote },
  // Enabled once the payment gateway is connected
  { id: "upi", label: "UPI", note: "Coming soon", icon: Smartphone, disabled: true },
  { id: "card", label: "Debit or credit card", note: "Coming soon", icon: CreditCard, disabled: true },
];

const inputClass =
  "h-11 w-full px-3.5 rounded-md border border-[#d9cbb9] bg-white text-sm text-ink placeholder:text-[#a8998b] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

const Field = ({ id, label, error, className = "", children }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-sm font-medium">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-700">{error}</p>}
  </div>
);

const Step = ({ n, title, children }) => (
  <section className="bg-white border border-line rounded-lg">
    <h2 className="flex items-center gap-3 px-5 py-4 border-b border-[#efe6da] text-base font-bold">
      <span className="w-7 h-7 rounded-full bg-[#f1e6d8] text-brand text-sm flex items-center justify-center">{n}</span>
      {title}
    </h2>
    <div className="p-5">{children}</div>
  </section>
);

const checkAddress = (a) => {
  const errors = {};
  if (!a.name.trim()) errors.name = "Enter the name of the person receiving it";
  if (!/^[6-9]\d{9}$/.test(a.phone.replace(/\s/g, ""))) errors.phone = "Enter a 10-digit mobile number";
  if (a.line.trim().length < 8) errors.line = "Enter the house number, street and area";
  if (!a.city.trim()) errors.city = "Enter your city";
  if (!a.state.trim()) errors.state = "Enter your state";
  if (!/^\d{6}$/.test(a.pincode.trim())) errors.pincode = "Enter a 6-digit pincode";
  return errors;
};

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user, authHeader } = useAuth();

  const items = state?.items || [];

  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [quote, setQuote] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: "",
    line: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [saved, setSaved] = useState([]);
  const [chosen, setChosen] = useState("new");
  const [saveAddress, setSaveAddress] = useState(true);

  // Saved addresses: pick one instead of typing
  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API}/users/me`, authHeader)
      .then(({ data }) => {
        setSaved(data.addresses || []);
        if (data.addresses?.length) pickSaved(data.addresses[0]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickSaved(a) {
    setChosen(a._id);
    setFieldErrors({});
    setAddress({ name: a.name, phone: a.phone, line: a.line, city: a.city, state: a.state, pincode: a.pincode });
  }

  const fetchQuote = (promoCode) =>
    axios.post(`${API}/orders/quote`, { items: toOrderItems(items), promoCode }, authHeader);

  // The server works out the real total
  useEffect(() => {
    if (!items.length || !user) return;

    fetchQuote(appliedPromo)
      .then(({ data }) => setQuote(data))
      .catch((err) => setError(err.response?.data?.message || "We couldn't work out the total. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user, appliedPromo]);

  if (!items.length) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted">Add something to your bag first.</p>
        <Link to="/explore" className="mt-6 inline-flex items-center h-11 px-5 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
          Continue shopping
        </Link>
      </div>
    );
  }

  const subtotal = quote?.subtotal ?? items.reduce((acc, item) => acc + getItemPrice(item), 0);
  const discount = quote?.discount || 0;
  const total = quote?.total ?? subtotal;

  const set = (key) => (e) => {
    setAddress({ ...address, [key]: e.target.value });
    setFieldErrors({ ...fieldErrors, [key]: undefined });
  };

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;

    try {
      const { data } = await fetchQuote(code);

      if (!data.promoValid) {
        setPromoMessage("That code isn't valid");
        setAppliedPromo("");
        return;
      }

      setAppliedPromo(code);
      setQuote(data);
      setPromoMessage(`${code} applied: you save ${money(data.discount)}`);
    } catch (err) {
      setPromoMessage(err.response?.data?.message || "Could not apply the code");
    }
  };

  const placeOrder = async () => {
    const errors = checkAddress(address);
    setFieldErrors(errors);

    if (Object.keys(errors).length) {
      setError("Please fix the delivery address");
      document.getElementById("delivery")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      setLoading(true);
      setError("");

      // No total is sent: the server prices the order itself
      const { data } = await axios.post(
        `${API}/orders`,
        {
          items: toOrderItems(items),
          promoCode: appliedPromo,
          paymentMethod,
          address: {
            name: address.name.trim(),
            phone: address.phone.replace(/\s/g, ""),
            address: `${address.line.trim()}, ${address.city.trim()}, ${address.state.trim()} - ${address.pincode.trim()}`,
          },
        },
        authHeader
      );

      // Remember a newly typed address for next time
      if (chosen === "new" && saveAddress && saved.length < 5) {
        axios
          .post(`${API}/users/me/addresses`, { ...address, phone: address.phone.replace(/s/g, "") }, authHeader)
          .catch(() => {});
      }

      clearCart();
      navigate("/success", { replace: true, state: { orders: data.orders, paymentMethod } });
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't place your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          <Lock size={14} />
          Prices are checked on our server before the order is placed
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="flex flex-col gap-5">
          <div id="delivery">
            <Step n="1" title="Delivery address">
              {saved.length > 0 && (
                <div role="radiogroup" aria-label="Saved addresses" className="mb-5 flex flex-col gap-2.5">
                  {saved.map((a) => (
                    <label
                      key={a._id}
                      className={`flex gap-3 px-4 py-3 rounded-md border cursor-pointer ${chosen === a._id ? "border-brand bg-cream" : "border-line hover:border-brand"}`}
                    >
                      <input type="radio" name="saved-address" checked={chosen === a._id} onChange={() => pickSaved(a)} className="mt-1 w-4 h-4 accent-[#6b4430]" />
                      <span className="text-sm">
                        <span className="block font-semibold">{a.name} · {a.phone}</span>
                        <span className="block text-muted">{a.line}, {a.city}, {a.state} - {a.pincode}</span>
                      </span>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer ${chosen === "new" ? "border-brand bg-cream" : "border-line hover:border-brand"}`}>
                    <input
                      type="radio"
                      name="saved-address"
                      checked={chosen === "new"}
                      onChange={() => {
                        setChosen("new");
                        setAddress({ name: user?.name || "", phone: "", line: "", city: "", state: "", pincode: "" });
                      }}
                      className="w-4 h-4 accent-[#6b4430]"
                    />
                    <span className="text-sm font-semibold">Deliver to a new address</span>
                  </label>
                </div>
              )}

              {chosen === "new" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="a-name" label="Full name" error={fieldErrors.name}>
                  <input id="a-name" autoComplete="name" value={address.name} onChange={set("name")} className={inputClass} />
                </Field>
                <Field id="a-phone" label="Mobile number" error={fieldErrors.phone}>
                  <input id="a-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={11} value={address.phone} onChange={set("phone")} placeholder="10-digit number" className={inputClass} />
                </Field>
                <Field id="a-line" label="House no., street and area" error={fieldErrors.line} className="sm:col-span-2">
                  <input id="a-line" autoComplete="street-address" value={address.line} onChange={set("line")} className={inputClass} />
                </Field>
                <Field id="a-city" label="City" error={fieldErrors.city}>
                  <input id="a-city" autoComplete="address-level2" value={address.city} onChange={set("city")} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="a-state" label="State" error={fieldErrors.state}>
                    <input id="a-state" autoComplete="address-level1" value={address.state} onChange={set("state")} className={inputClass} />
                  </Field>
                  <Field id="a-pin" label="Pincode" error={fieldErrors.pincode}>
                    <input id="a-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pincode} onChange={set("pincode")} className={inputClass} />
                  </Field>
                </div>
                {saved.length < 5 && (
                  <label className="sm:col-span-2 flex items-center gap-2.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-[#6b4430]" />
                    Save this address for next time
                  </label>
                )}
              </div>
              )}
            </Step>
          </div>

          <Step n="2" title="Payment">
            <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2.5">
              {PAYMENT_OPTIONS.map(({ id, label, note, icon: Icon, disabled }) => {
                const active = paymentMethod === id;
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-md border ${active ? "border-brand bg-cream" : "border-line"} ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:border-brand"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={active}
                      disabled={disabled}
                      onChange={() => setPaymentMethod(id)}
                      className="w-4 h-4 accent-[#6b4430]"
                    />
                    <Icon size={20} className="text-brand" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-muted">{note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Step>

          <Step n="3" title="Review items">
            <ul className="divide-y divide-[#efe6da]">
              {items.map((item, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0 flex gap-4">
                  <img
                    src={thumb(item.image || item.images?.[0], 200) || PLACEHOLDER_IMAGE}
                    alt=""
                    className="w-16 h-20 rounded-md object-cover bg-cream border border-line flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {item.mode === "rent" && item.rentStart
                        ? `Rental · ${format(parseISO(item.rentStart), "d MMM")} – ${format(parseISO(item.rentEnd), "d MMM yyyy")}`
                        : "Purchase"}
                      {item.size ? ` · Size ${item.size}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">{money(getItemPrice(item))}</p>
                </li>
              ))}
            </ul>
          </Step>
        </div>

        {/* SUMMARY */}
        <aside className="bg-white border border-line rounded-lg p-5 lg:sticky lg:top-32 flex flex-col gap-4">
          <h2 className="text-base font-bold">Order summary</h2>

          <div className="flex gap-2">
            <label htmlFor="promo" className="sr-only">
              Promo code
            </label>
            <input
              id="promo"
              value={promo}
              onChange={(e) => {
                setPromo(e.target.value);
                setPromoMessage("");
              }}
              placeholder="Promo code"
              className={`${inputClass} uppercase`}
            />
            <button type="button" onClick={applyPromo} className="h-11 px-4 rounded-md border border-ink text-sm font-semibold hover:bg-cream">
              Apply
            </button>
          </div>
          {promoMessage && <p className={`-mt-2 text-xs ${appliedPromo ? "text-[#3f6b4a]" : "text-red-700"}`}>{promoMessage}</p>}

          <dl className="flex flex-col gap-2 text-sm border-t border-[#efe6da] pt-4">
            <div className="flex justify-between">
              <dt className="text-muted">Items ({items.length})</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#3f6b4a]">
                <dt>Discount</dt>
                <dd>−{money(discount)}</dd>
              </div>
            )}
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
            disabled={loading || !quote}
            onClick={placeOrder}
            className="h-12 rounded-md bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Placing order…" : `Place order · ${money(total)}`}
          </button>
          <p className="text-xs text-muted leading-relaxed">
            The seller has to accept your order before it ships. You can cancel any time before it's shipped.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
