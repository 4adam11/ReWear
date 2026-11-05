import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  Search,
  ShoppingBag,
  Sparkles,
  Wallet,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    title: "Discover Your Style",
    desc: "Explore trending fashion pieces curated for parties, weddings, streetwear, and everyday looks.",
    icon: Search,
  },

  {
    title: "Buy or Rent Smartly",
    desc: "Own timeless outfits forever or rent premium looks only when you need them.",
    icon: ShoppingBag,
  },

  {
    title: "Wear With Confidence",
    desc: "Look premium without overspending while reducing fashion waste at the same time.",
    icon: Sparkles,
  },

  {
    title: "Resell & Earn Back",
    desc: "List your outfits again and turn your wardrobe into a recurring source of income.",
    icon: Wallet,
  },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf6ef] overflow-hidden relative">

      {/* AMBIENT GLOW */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-200/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-200/20 blur-3xl rounded-full" />

      {/* HERO */}
      <section className="relative max-w-[1200px] mx-auto px-6 pt-24 pb-16 text-center">

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
            duration: 0.7,
          }}
        >

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-600">

            <Sparkles size={14} />

            Smarter Fashion Experience

          </div>

          <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#2b1d14] leading-[1.1]">

            Fashion That
            <br />

            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Works Beyond One Wear
            </span>

          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-gray-500 text-base sm:text-lg leading-8">

            ReWear helps you buy, rent, and resell fashion
            effortlessly — making premium style more affordable,
            sustainable, and flexible.

          </p>

        </motion.div>

      </section>

      {/* STEPS */}
      <section className="relative max-w-[1200px] mx-auto px-6 pb-24">

        <div className="relative">

          {/* TIMELINE */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200 -translate-x-1/2" />

          <div className="space-y-10 lg:space-y-14">

            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={i}

                  initial={{
                    opacity: 0,
                    y: 50,
                  }}

                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}

                  viewport={{
                    once: true,
                  }}

                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                  }}

                  className={`relative flex ${i % 2 === 0
                      ? "lg:justify-start"
                      : "lg:justify-end"
                    }`}
                >

                  {/* CARD */}
                  <motion.div
                    whileHover={{
                      y: -6,
                    }}

                    className="w-full lg:w-[48%] bg-white border border-gray-100 rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                  >

                    {/* TOP */}
                    <div className="flex items-start justify-between gap-4">

                      {/* ICON */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">

                        <Icon
                          size={24}
                          className="text-white"
                        />

                      </div>

                      {/* NUMBER */}
                      <div className="text-sm font-semibold text-gray-300">
                        0{i + 1}
                      </div>

                    </div>

                    {/* TEXT */}
                    <div className="mt-6">

                      <h2 className="text-2xl font-semibold text-[#2b1d14]">
                        {step.title}
                      </h2>

                      <p className="mt-3 text-gray-500 leading-7">
                        {step.desc}
                      </p>

                    </div>

                  </motion.div>

                  {/* TIMELINE DOT */}
                  <div className="hidden lg:flex absolute left-1/2 top-10 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 border-4 border-white shadow-lg" />

                </motion.div>
              );
            })}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="relative max-w-[1200px] mx-auto px-6 pb-24">

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            duration: 0.6,
          }}

          className="relative overflow-hidden rounded-[40px] bg-[#2b1d14] px-6 sm:px-10 py-14 sm:py-16 text-center"
        >

          {/* GLOW */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />

          <div className="relative">

            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-tight">

              Your Wardrobe Has
              <br />

              More Value Than You Think

            </h2>

            <p className="mt-5 max-w-2xl mx-auto text-gray-300 leading-8">

              Stop letting outfits sit unused.
              Start renting, reselling, and styling smarter with ReWear.

            </p>

            {/* BUTTONS */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

              <button
                onClick={() =>
                  navigate("/explore")
                }

                className="inline-flex items-center justify-center gap-2 bg-white text-[#2b1d14] px-7 py-4 rounded-2xl font-medium hover:scale-[1.02] transition"
              >
                Explore Products

                <ArrowRight size={18} />

              </button>

              <button
                onClick={() =>
                  navigate("/sell")
                }

                className="border border-white/20 text-white px-7 py-4 rounded-2xl font-medium hover:bg-white/10 transition"
              >
                Start Selling
              </button>

            </div>

          </div>

        </motion.div>

      </section>

    </div>
  );
};

export default HowItWorks;