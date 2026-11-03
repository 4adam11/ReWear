import { useNavigate } from "react-router-dom";
import { CLOUDINARY_IMAGE_BASE } from "../../utils/contants";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";

const Hero = () => {
  const navigate = useNavigate();

  const { scrollY } = useScroll();

  // PARALLAX
  const imageY = useTransform(scrollY, [0, 500], [0, 80]);
  const blobY = useTransform(scrollY, [0, 500], [0, 120]);

  // MOUSE REACTIVE TILT
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-300, 300], [10, -10]),
    {
      stiffness: 120,
      damping: 15,
    }
  );

  const rotateY = useSpring(
    useTransform(mouseX, [-300, 300], [-10, 10]),
    {
      stiffness: 120,
      damping: 15,
    }
  );

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#f9fafb]">

      {/* BACKGROUND BLOBS */}
      <motion.div
        style={{ y: blobY }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
        }}
        className="absolute top-[-120px] left-[-100px] w-[320px] h-[320px] bg-indigo-300/30 blur-3xl rounded-full"
      />

      <motion.div
        style={{ y: blobY }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
        }}
        className="absolute bottom-[-120px] right-[-80px] w-[300px] h-[300px] bg-pink-300/30 blur-3xl rounded-full"
      />

      {/* MAIN CONTAINER */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-20 lg:pb-28">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >

            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white shadow-sm mb-6"
            >
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

              <span className="text-sm font-medium text-gray-700">
                Sustainable Fashion Marketplace
              </span>
            </motion.div>

            {/* HEADING */}
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[84px] leading-[1] font-black tracking-tight text-gray-900"
            >
              Wear the

              <br />

              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Moment.
              </span>

              <br />

              Not the

              <br />

              <span className="relative inline-block">
                Price Tag.

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    delay: 0.8,
                    duration: 1,
                  }}
                  className="absolute -bottom-2 left-0 h-3 bg-pink-200/60 rounded-full -z-10"
                />
              </span>
            </motion.h1>

            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-7 max-w-xl text-base sm:text-lg leading-8 text-gray-600"
            >
              Buy, rent, and resell fashion effortlessly.
              Every photo is AI-checked, so what you see is real, wearable fashion.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >

              <motion.button
                whileHover={{
                  scale: 1.05,
                  y: -3,
                }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/explore")}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_15px_40px_rgba(47,125,91,0.35)]"
              >
                Explore Styles →
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.03,
                  y: -2,
                }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/explore?mode=rent")}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm sm:text-base font-semibold border border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-all duration-300"
              >
                Rent for Events →
              </motion.button>

            </motion.div>

            {/* MOVING MARQUEE */}
            <div className="mt-10 overflow-hidden max-w-xl">

              <motion.div
                animate={{
                  x: ["0%", "-50%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 14,
                  ease: "linear",
                }}
                className="flex gap-8 whitespace-nowrap text-sm font-semibold text-gray-400"
              >
                {[
                  "Vintage",
                  "Streetwear",
                  "Luxury",
                  "Oversized",
                  "Classic",
                  "Minimal",
                  "Sustainable",
                  "Vintage",
                  "Streetwear",
                  "Luxury",
                  "Oversized",
                  "Classic",
                ].map((item, i) => (
                  <span key={i}>
                    ✦ {item}
                  </span>
                ))}
              </motion.div>

            </div>

            {/* SELL LINK */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => navigate("/login")}
              className="mt-6 inline-block text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer transition"
            >
              Start Selling →
            </motion.p>

            {/* STATS */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-lg"
            >

              {[
                ["10K+", "Fashion Lovers"],
                ["5K+", "Products Listed"],
                ["99%", "Happy Users"],
              ].map(([value, label], index) => (
                <motion.div
                  key={label}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4 + index,
                  }}
                  className="rounded-2xl bg-white/80 backdrop-blur-lg border border-white shadow-md p-4"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {value}
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {label}
                  </p>
                </motion.div>
              ))}

            </motion.div>
          </motion.div>

          {/* RIGHT VISUALS */}
          <motion.div
            style={{ y: imageY }}
            onMouseMove={handleMouseMove}
            className="relative flex justify-center items-center"
          >

            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative w-full max-w-[650px] h-[420px] sm:h-[560px] lg:h-[650px]"
            >

              {/* GLOW RING */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  repeat: Infinity,
                  duration: 18,
                  ease: "linear",
                }}
                className="absolute inset-[12%] rounded-full border border-indigo-200/40"
              />

              {/* FLOATING ORB */}
              <motion.div
                animate={{
                  y: [0, -30, 0],
                  x: [0, 20, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                }}
                className="absolute top-[10%] left-[10%] w-24 h-24 rounded-full bg-gradient-to-r from-pink-300/40 to-indigo-300/40 blur-2xl"
              />

              {/* MAIN IMAGE */}
              <motion.img
                animate={{
                  y: [0, -18, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                }}
                whileHover={{
                  scale: 1.03,
                }}
                src={`${CLOUDINARY_IMAGE_BASE}/hero1_vf1dzb`}
                alt="main"
                className="absolute left-0 bottom-0 w-[58%] h-[76%] object-cover rounded-[34px] shadow-[0_25px_60px_rgba(47,125,91,0.18)] z-20"
              />

              {/* TOP RIGHT */}
              <motion.img
                animate={{
                  y: [0, 14, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                }}
                whileHover={{
                  scale: 1.04,
                }}
                src={`${CLOUDINARY_IMAGE_BASE}/hero2_ebpuhy`}
                alt="top"
                className="absolute right-0 top-0 w-[38%] h-[26%] object-cover rounded-[28px] shadow-2xl"
              />

              {/* CENTER OVERLAY */}
              <motion.img
                animate={{
                  y: [0, -20, 0],
                  rotate: [3, 6, 3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 7,
                }}
                whileHover={{
                  scale: 1.05,
                }}
                src={`${CLOUDINARY_IMAGE_BASE}/hero3_upr4df`}
                alt="overlay"
                className="absolute right-[12%] top-[16%] w-[42%] h-[48%] object-cover rounded-[30px] border-[6px] border-white shadow-[0_30px_70px_rgba(0,0,0,0.18)] z-30"
              />

              {/* BOTTOM RIGHT */}
              <motion.img
                animate={{
                  y: [0, 16, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5.5,
                }}
                whileHover={{
                  scale: 1.03,
                }}
                src={`${CLOUDINARY_IMAGE_BASE}/hero2_ebpuhy`}
                alt="bottom"
                className="absolute right-0 bottom-[4%] w-[36%] h-[32%] object-cover rounded-[28px] shadow-xl"
              />

              {/* FLOATING TAGS */}
              {[
                {
                  text: "Vintage",
                  top: "8%",
                  left: "45%",
                },
                {
                  text: "Classic",
                  top: "55%",
                  left: "0%",
                },
               
              ].map((tag, index) => (
                <motion.div
                  key={tag.text}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3 + index,
                  }}
                  className="absolute px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-xl text-sm font-semibold text-gray-700 z-40"
                  style={{
                    top: tag.top,
                    left: tag.left,
                    right: tag.right,
                  }}
                >
                  {tag.text}
                </motion.div>
              ))}

              {/* GLASS CARD */}
              <motion.div
                animate={{
                  y: [0, -14, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                }}
                className="absolute left-[36%] bottom-[10%] px-5 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-2xl z-50"
              >
                <p className="text-xs text-gray-500">
                  Trending Right Now
                </p>

                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  Sustainable Streetwear
                </h3>
              </motion.div>

            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;