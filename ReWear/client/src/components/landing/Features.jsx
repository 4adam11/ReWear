import { motion } from "framer-motion";

import {
  Sparkles,
  Leaf,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";

const cardVariant = {
  hidden: {
    opacity: 0,
    y: 80,
  },

  visible: (i) => ({
    opacity: 1,
    y: 0,

    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const Features = () => {
  const features = [
    {
      title: "AI Photo Checks",

      desc:
        "Every listing photo is checked by an AI model, so you only see real clothing and nothing inappropriate.",

      gradient:
        "from-indigo-500 via-purple-500 to-pink-500",

      glow:
        "group-hover:shadow-indigo-500/30",

      icon: <IndianRupee size={28} />,
    },

    {
      title: "Rent for Every Moment",

      desc:
        "From weddings to parties — wear premium fashion without owning everything.",

      gradient:
        "from-pink-500 via-rose-500 to-orange-400",

      glow:
        "group-hover:shadow-pink-500/30",

      icon: <Sparkles size={28} />,
    },

    {
      title: "Sustainable Fashion",

      desc:
        "Reduce waste, extend clothing life, and make fashion more circular.",

      gradient:
        "from-emerald-500 via-green-500 to-lime-400",

      glow:
        "group-hover:shadow-emerald-500/30",

      icon: <Leaf size={28} />,
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-white py-24 sm:py-28">

      {/* BACKGROUND GRADIENTS */}
      <div className="absolute top-0 left-[-120px] w-[280px] h-[280px] bg-indigo-200/30 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-[-120px] w-[300px] h-[300px] bg-pink-200/30 blur-3xl rounded-full" />

      {/* CONTAINER */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          viewport={{ once: true }}

          transition={{
            duration: 0.8,
          }}

          className="max-w-2xl"
        >

          {/* MINI LABEL */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-indigo-50 mb-6">

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
              }}

              transition={{
                repeat: Infinity,
                duration: 2,
              }}

              className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
            />

            <span className="text-sm font-semibold text-gray-700">
              Why ReWear
            </span>
          </div>

          {/* TITLE */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.05]">

            Built for How
            <br />

            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              You Actually
            </span>

            <br />

            Wear Fashion
          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 text-base sm:text-lg text-gray-600 leading-8 max-w-xl">
            Not just buying — renting, reselling,
            and optimizing every outfit for the next generation.
          </p>
        </motion.div>

        {/* FEATURE GRID */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">

          {features.map((item, i) => (
            <motion.div
              key={i}

              custom={i}

              initial="hidden"

              whileInView="visible"

              viewport={{ once: true }}

              variants={cardVariant}

              whileHover={{
                y: -14,
              }}

              className="group relative"
            >

              {/* OUTER GLOW */}
              <div
                className={`absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 blur-2xl transition duration-500 bg-gradient-to-r ${item.gradient}`}
              />

              {/* CARD */}
              <div className="relative h-full rounded-[32px] border border-gray-100 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-lg transition-all duration-500 overflow-hidden">

                {/* HOVER SPOTLIGHT */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_top_right,rgba(107,68,48,0.12),transparent_40%)]" />

                {/* FLOATING PARTICLE */}
                <motion.div
                  animate={{
                    y: [0, -12, 0],
                    x: [0, 8, 0],
                  }}

                  transition={{
                    repeat: Infinity,
                    duration: 4 + i,
                  }}

                  className={`absolute top-6 right-6 w-16 h-16 rounded-full blur-2xl opacity-20 bg-gradient-to-r ${item.gradient}`}
                />

                {/* ICON */}
                <motion.div
                  whileHover={{
                    rotate: 8,
                    scale: 1.08,
                  }}

                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white shadow-xl ${item.glow} transition duration-500`}
                >
                  {item.icon}
                </motion.div>

                {/* TITLE */}
                <h3 className="mt-8 text-2xl font-bold text-gray-900 tracking-tight">
                  {item.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="mt-4 text-gray-600 leading-8 text-[15px]">
                  {item.desc}
                </p>

                {/* BOTTOM */}
                <div className="mt-8 flex items-center justify-between">

                  {/* <span className="text-sm font-semibold text-gray-500">
                    Learn More
                  </span> */}

                  {/* <motion.div
                    whileHover={{
                      x: 4,
                      y: -2,
                    }}

                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    <ArrowUpRight size={18} />
                  </motion.div> */}

                </div>

                {/* BOTTOM GRADIENT BAR */}
                <motion.div
                  initial={{
                    width: 0,
                  }}

                  whileInView={{
                    width: "100%",
                  }}

                  transition={{
                    delay: i * 0.2,
                    duration: 0.8,
                  }}

                  className={`absolute bottom-0 left-0 h-[4px] rounded-full bg-gradient-to-r ${item.gradient}`}
                />

              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default Features;