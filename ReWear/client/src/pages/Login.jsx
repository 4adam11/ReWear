import { useState } from "react";
import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/ui/Logo";

import API from "../utils/api";

const Login = () => {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  const [
    isRegister,
    setIsRegister,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  // INPUT
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });

    setError("");
  };

  // SUBMIT
  const submitHandler = async (
    e
  ) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email:
        form.email.trim(),
      password:
        form.password.trim(),
    };

    if (
      !payload.email ||
      !payload.password ||
      (isRegister &&
        !payload.name)
    ) {
      setError(
        "Please fill all fields"
      );

      return;
    }

    try {
      setLoading(true);

      setError("");

      const url = isRegister
        ? `${API}/auth/register`
        : `${API}/auth/login`;

      const body = isRegister
        ? payload
        : {
          email:
            payload.email,
          password:
            payload.password,
        };

      const { data } =
        await axios.post(
          url,
          body
        );

      login(data);

      navigate("/explore");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ?.message ||
        "Server error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">

      {/* BACKGROUND IMAGE */}
      <motion.img
        initial={{
          scale: 1.03,
        }}

        animate={{
          scale: 1,
        }}

        transition={{
          duration: 1.2,
        }}

        src="https://res.cloudinary.com/dygzp2lyy/image/upload/v1774164438/rewear-login-bg_otosam.png"

        alt="fashion"

        className="
  absolute
  inset-0
  w-full
  h-full
  object-cover
  object-center
"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          min-h-screen
          flex
          items-center
          justify-center
          lg:justify-end
          px-6
          lg:px-24
        "
      >

        {/* FORM ONLY */}
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.6,
          }}

          className="
            w-full
            max-w-[430px]
          "
        >

          {/* BRAND */}
          <div className="mb-10">

            <h1 className="text-5xl font-semibold text-white tracking-tight inline-flex items-center gap-4">
              <LogoMark size={52} />
              ReWear


            </h1>

            <p className="mt-3 text-gray-300 text-lg">
              Fashion beyond one wear.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div
              className="
                mb-5
                bg-red-500/15
                border
                border-red-500/20
                text-red-200
                text-sm
                px-4
                py-3
                rounded-2xl
                backdrop-blur-md
              "
            >
              {error}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={
              submitHandler
            }

            className="space-y-5"
          >

            {/* NAME */}
            {isRegister && (
              <div>

                <label className="text-sm text-gray-200">
                  Full Name
                </label>

                <input
                  name="name"

                  placeholder="John Doe"

                  value={form.name}

                  onChange={
                    handleChange
                  }

                  className="
                    w-full
                    mt-2
                    bg-white/10
                    backdrop-blur-md
                    border
                    border-white/10
                    text-white
                    placeholder:text-gray-400
                    rounded-2xl
                    px-5
                    py-4
                    focus:outline-none
                    focus:ring-2
                    focus:ring-pink-400
                  "
                />

              </div>
            )}

            {/* EMAIL */}
            <div>

              <label className="text-sm text-gray-200">
                Email Address
              </label>

              <input
                name="email"

                type="email"

                placeholder="john@example.com"

                value={form.email}

                onChange={
                  handleChange
                }

                className="
                  w-full
                  mt-2
                  bg-white/10
                  backdrop-blur-md
                  border
                  border-white/10
                  text-white
                  placeholder:text-gray-400
                  rounded-2xl
                  px-5
                  py-4
                  focus:outline-none
                  focus:ring-2
                  focus:ring-pink-400
                "
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label className="text-sm text-gray-200">
                Password
              </label>

              <input
                name="password"

                type="password"

                placeholder="••••••••"

                value={form.password}

                onChange={
                  handleChange
                }

                className="
                  w-full
                  mt-2
                  bg-white/10
                  backdrop-blur-md
                  border
                  border-white/10
                  text-white
                  placeholder:text-gray-400
                  rounded-2xl
                  px-5
                  py-4
                  focus:outline-none
                  focus:ring-2
                  focus:ring-pink-400
                "
              />

            </div>

            {/* BUTTON */}
            <button
              type="submit"

              disabled={loading}

              className="
                w-full
                mt-2
                bg-brand
                hover:bg-brand-dark
                text-white
                py-4
                rounded-2xl
                font-medium
                flex
                items-center
                justify-center
                gap-2
                hover:opacity-95
                transition
                shadow-xl
              "
            >

              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Login"}

              {!loading && (
                <ArrowRight
                  size={18}
                />
              )}

            </button>

          </form>

          {/* SWITCH */}
          <div className="mt-8">

            <button
              onClick={() => {
                setIsRegister(
                  !isRegister
                );

                setError("");
              }}

              className="
                text-sm
                text-gray-300
                hover:text-white
                transition
              "
            >

              {isRegister
                ? "Already have an account? Login"
                : "New here? Create an account"}

            </button>

          </div>

        </motion.div>

      </div>

    </div>
  );
};

export default Login;