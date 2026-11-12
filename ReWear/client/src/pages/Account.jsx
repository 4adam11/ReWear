import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trash2 } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import usePageTitle from "../hooks/usePageTitle";
import VerificationCard from "../components/account/VerificationCard";

const inputClass =
  "h-11 w-full px-3.5 rounded-md border border-[#d9cbb9] bg-white text-sm text-ink placeholder:text-[#a8998b] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-[#f6f1ea] disabled:text-muted";

const Field = ({ id, label, className = "", children }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-sm font-medium">
      {label}
    </label>
    {children}
  </div>
);

const Card = ({ title, text, children }) => (
  <section className="bg-white border border-line rounded-sm">
    <div className="px-5 py-4 border-b border-[#efe6da]">
      <h2 className="text-base font-bold">{title}</h2>
      {text && <p className="text-[13px] text-muted">{text}</p>}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const Message = ({ msg }) =>
  msg ? (
    <p role="status" className={`text-sm ${msg.ok ? "text-[#3f6b4a]" : "text-red-700"}`}>
      {msg.text}
    </p>
  ) : null;

const SaveButton = ({ busy, children }) => (
  <button type="submit" disabled={busy} className="btn btn-dark btn-sm">
    {children}
  </button>
);

const formatAddress = (a) => `${a.line}, ${a.city}, ${a.state} - ${a.pincode}`;

const EMPTY_ADDRESS = { name: "", phone: "", line: "", city: "", state: "", pincode: "" };

const Account = () => {
  usePageTitle("Your account");
  const { user, authHeader, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [details, setDetails] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({});

  useEffect(() => {
    axios.get(`${API}/users/me`, authHeader).then(({ data }) => {
      setProfile(data);
      setDetails({ name: data.name, phone: data.phone });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (key, fn, okText) => {
    setBusy(key);
    setMsg((m) => ({ ...m, [key]: null }));
    try {
      const result = await fn();
      setMsg((m) => ({ ...m, [key]: { ok: true, text: okText } }));
      return result;
    } catch (err) {
      setMsg((m) => ({ ...m, [key]: { ok: false, text: err.response?.data?.message || "Something went wrong" } }));
      return null;
    } finally {
      setBusy("");
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    const res = await run("details", () => axios.patch(`${API}/users/me`, details, authHeader), "Saved");
    if (res) {
      setProfile(res.data);
      // Keep the name in the header up to date
      login({ ...user, name: res.data.name });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const res = await run("password", () => axios.patch(`${API}/users/me/password`, passwords, authHeader), "Password changed");
    if (res) {
      setPasswords({ currentPassword: "", newPassword: "" });
      // Other devices are signed out; keep this one logged in with the new token
      login({ ...user, token: res.data.token });
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    const res = await run("address", () => axios.post(`${API}/users/me/addresses`, address, authHeader), "Address saved");
    if (res) {
      setProfile(res.data);
      setAddress(EMPTY_ADDRESS);
      setAdding(false);
    }
  };

  const removeAddress = async (id) => {
    const res = await run("address", () => axios.delete(`${API}/users/me/addresses/${id}`, authHeader), "Address removed");
    if (res) setProfile(res.data);
  };

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-64 rounded-sm bg-white border border-line animate-pulse" />
      </div>
    );
  }

  const setA = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">Your account</h1>
        <Link to={`/seller/${profile._id}`} className="text-sm font-semibold text-brand hover:underline">
          View your public shop
        </Link>
      </div>

      <Card title="Personal details">
        <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2">
          <Field id="acc-name" label="Full name">
            <input id="acc-name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className={inputClass} />
          </Field>
          <Field id="acc-phone" label="Mobile number">
            <input id="acc-phone" type="tel" inputMode="numeric" maxLength={11} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} className={inputClass} />
          </Field>
          <Field id="acc-email" label="Email" className="sm:col-span-2">
            <input id="acc-email" value={profile.email} disabled className={inputClass} />
          </Field>
          <div className="sm:col-span-2 flex items-center gap-3">
            <SaveButton busy={busy === "details"}>Save details</SaveButton>
            <Message msg={msg.details} />
          </div>
        </form>
      </Card>

      <Card title="Saved addresses" text="Pick one at checkout instead of typing it every time.">
        <div className="flex flex-col gap-3">
          {profile.addresses.length === 0 && !adding && <p className="text-sm text-muted">You haven't saved any addresses yet.</p>}

          {profile.addresses.map((a) => (
            <div key={a._id} className="flex gap-3 rounded-md border border-line p-3.5">
              <div className="flex-1 text-sm">
                <p className="font-semibold">{a.name} · {a.phone}</p>
                <p className="text-muted">{formatAddress(a)}</p>
              </div>
              <button type="button" onClick={() => removeAddress(a._id)} aria-label={`Remove address for ${a.name}`} className="w-9 h-9 flex items-center justify-center text-muted hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {adding ? (
            <form onSubmit={addAddress} className="grid gap-4 sm:grid-cols-2 rounded-md border border-line p-4">
              <Field id="ad-name" label="Full name">
                <input id="ad-name" value={address.name} onChange={setA("name")} className={inputClass} />
              </Field>
              <Field id="ad-phone" label="Mobile number">
                <input id="ad-phone" type="tel" inputMode="numeric" maxLength={11} value={address.phone} onChange={setA("phone")} className={inputClass} />
              </Field>
              <Field id="ad-line" label="House no., street and area" className="sm:col-span-2">
                <input id="ad-line" value={address.line} onChange={setA("line")} className={inputClass} />
              </Field>
              <Field id="ad-city" label="City">
                <input id="ad-city" value={address.city} onChange={setA("city")} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="ad-state" label="State">
                  <input id="ad-state" value={address.state} onChange={setA("state")} className={inputClass} />
                </Field>
                <Field id="ad-pin" label="Pincode">
                  <input id="ad-pin" inputMode="numeric" maxLength={6} value={address.pincode} onChange={setA("pincode")} className={inputClass} />
                </Field>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <SaveButton busy={busy === "address"}>Save address</SaveButton>
                <button type="button" onClick={() => setAdding(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            profile.addresses.length < 5 && (
              <button type="button" onClick={() => setAdding(true)} className="self-start text-sm font-semibold text-brand hover:underline">
                + Add an address
              </button>
            )
          )}
          <Message msg={msg.address} />
        </div>
      </Card>

      {/* Remounts after the phone number changes, so the checklist updates */}
      <VerificationCard key={profile.phone || "no-phone"} />

      <Card title="Change password">
        <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
          <Field id="pw-current" label="Current password">
            <input id="pw-current" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className={inputClass} />
          </Field>
          <Field id="pw-new" label="New password (8+ characters)">
            <input id="pw-new" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={inputClass} />
          </Field>
          <div className="sm:col-span-2 flex items-center gap-3">
            <SaveButton busy={busy === "password"}>Change password</SaveButton>
            <Message msg={msg.password} />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Account;
