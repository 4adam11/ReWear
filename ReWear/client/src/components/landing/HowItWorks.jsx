import { motion } from "framer-motion";

import {
  UploadCloud,
  BadgeDollarSign,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    title: "Upload Your Piece",

    desc:
      "List your outfit in seconds. Our AI photo check makes sure every listing shows real clothing.",

    icon: <UploadCloud size={28} />,

    gradient:
      "from-indigo-500 via-purple-500 to-pink-500",
  },

  {
    title: "Sell or Rent",

    desc:
      "Choose whether to sell permanently or rent for special moments.",

    icon: <BadgeDollarSign size={28} />,

    gradient:
      "from-pink-500 via-rose-500 to-orange-400",
  },

  {
    title: "Earn or Save",

    desc:
      "Monetize your wardrobe or wear premium fashion without overspending.",

    icon: <Sparkles size={28} />,

    gradient:
      "from-emerald-500 via-green-500 to-lime-400",
  },
];

const containerVariant = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const itemVariant = {
  hidden: {
    opacity: 0,
    y: 70,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const HowItWorks = () => {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-gray-50 py-24 sm:py-28">

      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-120px] left-[-100px] w-[280px] h-[280px] rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="absolute bottom-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-pink-200/30 blur-3xl" />

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

          className="text-center max-w-3xl mx-auto"
        >

          {/* MINI LABEL */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white shadow-sm mb-6">

            <motion.div
              animate={{
                scale: [1, 1.4, 1],
              }}

              transition={{
                repeat: Infinity,
                duration: 2,
              }}

              className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
            />

            <span className="text-sm font-semibold text-gray-700">
              Simple Process
            </span>
          </div>

          {/* TITLE */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.05]">

            Start in Minutes.

            <br />

            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              No Complexity.
            </span>

          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 text-base sm:text-lg text-gray-600 leading-8 max-w-2xl mx-auto">
            Turn your wardrobe into value with a seamless
            fashion experience built for the next generation.
          </p>

        </motion.div>

        {/* STEPS */}
        <div className="relative mt-20">

          {/* CONNECTING GLOW LINE */}
          <div className="hidden lg:block absolute top-[72px] left-0 w-full h-[2px] overflow-hidden">

            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}

              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "linear",
              }}

              className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70"
            />

            <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100" />

          </div>

          {/* GRID */}
          <motion.div
            variants={containerVariant}

            initial="hidden"

            whileInView="visible"

            viewport={{ once: true }}

            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-10"
          >

            {steps.map((step, i) => (
              <motion.div
                key={i}

                variants={itemVariant}

                whileHover={{
                  y: -16,
                }}

                className="group relative"
              >

                {/* OUTER GLOW */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 blur-2xl rounded-[36px] bg-gradient-to-r ${step.gradient}`}
                />

                {/* CARD */}
                <div className="relative h-full rounded-[36px] border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl overflow-hidden">

                  {/* FLOATING GRADIENT ORB */}
                  <motion.div
                    animate={{
                      y: [0, -16, 0],
                      x: [0, 10, 0],
                    }}

                    transition={{
                      repeat: Infinity,
                      duration: 5 + i,
                    }}

                    className={`absolute top-6 right-6 w-20 h-20 rounded-full blur-3xl opacity-20 bg-gradient-to-r ${step.gradient}`}
                  />

                  {/* STEP NUMBER */}
                  <motion.div
                    animate={{
                      scale: [1, 1.08, 1],
                    }}

                    transition={{
                      repeat: Infinity,
                      duration: 3,
                    }}

                    className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white shadow-2xl`}
                  >

                    {/* ROTATING RING */}
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}

                      transition={{
                        repeat: Infinity,
                        duration: 10,
                        ease: "linear",
                      }}

                      className="absolute inset-[-6px] rounded-[22px] border border-white/40"
                    />

                    <span className="absolute top-2 left-2 text-[10px] font-bold opacity-70">
                      0{i + 1}
                    </span>

                    {step.icon}

                  </motion.div>

                  {/* CONTENT */}
                  <div className="mt-8">

                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {step.title}
                    </h3>

                    <p className="mt-4 text-gray-600 leading-8 text-[15px]">
                      {step.desc}
                    </p>

                  </div>

                  {/* FOOTER */}
                  <div className="mt-10 flex items-center justify-between">

                    <span className="text-sm font-semibold text-gray-500">
                      Step {i + 1}
                    </span>

                    {/* <motion.div
                      whileHover={{
                        x: 5,
                      }}

                      className={`w-11 h-11 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white shadow-lg`}
                    >
                      <ArrowRight size={18} />
                    </motion.div> */}

                  </div>

                  {/* BOTTOM BAR */}
                  <motion.div
                    initial={{
                      width: 0,
                    }}

                    whileInView={{
                      width: "100%",
                    }}

                    transition={{
                      duration: 1,
                      delay: i * 0.2,
                    }}

                    className={`absolute bottom-0 left-0 h-[4px] rounded-full bg-gradient-to-r ${step.gradient}`}
                  />

                </div>
              </motion.div>
            ))}

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;