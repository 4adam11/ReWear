import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, ShieldCheck, Truck, CalendarDays } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import Logo from "../components/ui/Logo";
import API from "../utils/api";

const POINTS = [
  { icon: ShieldCheck, text: "Every listing is reviewed by the ReWear team before it goes live" },
  { icon: CalendarDays, text: "Rent for your dates, with booked days blocked for everyone else" },
  { icon: Truck, text: "Track every order from the seller to your door" },
];

const Field = ({ id, label, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-muted">{hint}</p>}
  </div>
);

const inputClass =
  "h-11 w-full px-3.5 rounded-md border border-[#d9cbb9] bg-white text-sm text-ink placeholder:text-[#a8998b] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Where to go afterwards: the page that sent them here, else the shop
  const from = location.state?.from || "/explore";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const switchMode = (register) => {
    setIsRegister(register);
    setError("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
    };

    if (!payload.email || !payload.password || (isRegister && !payload.name)) {
      setError("Please fill in every field");
      return;
    }

    if (isRegister && payload.password.length < 8) {
      setError("Your password needs at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await axios.post(
        `${API}/auth/${isRegister ? "register" : "login"}`,
        isRegister ? payload : { email: payload.email, password: payload.password }
      );

      login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper grid lg:grid-cols-2">
      {/* BRAND PANEL */}
      <aside className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12">
        <Link to="/" aria-label="ReWear home">
          <Logo size={40} textClassName="text-2xl font-bold text-paper" />
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Buy or rent pre-loved Indian fashion.</h2>
          <ul className="mt-8 flex flex-col gap-5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-[15px] leading-relaxed text-[#e3d5c4]">
                <Icon size={20} className="text-[#e8c39e] flex-shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#bfae9c]">Academic project · Medicaps University, Indore</p>
      </aside>

      {/* FORM */}
      <main className="flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <Link to="/" aria-label="ReWear home" className="lg:hidden inline-block mb-8">
            <Logo size={36} textClassName="text-xl font-bold text-ink" />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister ? "Start buying, renting and selling on ReWear." : "Log in to continue to ReWear."}
          </p>

          <div role="tablist" aria-label="Log in or sign up" className="mt-6 grid grid-cols-2 p-1 rounded-md bg-[#efe6da]">
            {[
              [false, "Log in"],
              [true, "Create account"],
            ].map(([register, label]) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isRegister === register}
                onClick={() => switchMode(register)}
                className={`h-9 rounded text-sm font-semibold transition ${isRegister === register ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submitHandler} noValidate className="mt-6 flex flex-col gap-4">
            {isRegister && (
              <Field id="name" label="Full name">
                <input id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} className={inputClass} />
              </Field>
            )}

            <Field id="email" label="Email">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>

            <Field id="password" label="Password" hint={isRegister ? "At least 8 characters." : undefined}>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            {isRegister ? "Already have an account? " : "New to ReWear? "}
            <button type="button" onClick={() => switchMode(!isRegister)} className="font-semibold text-brand hover:underline">
              {isRegister ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
