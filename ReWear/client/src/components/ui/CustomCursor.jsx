import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [variant, setVariant] = useState("default");
  const [label, setLabel] = useState("");
  const [isDesktop, setIsDesktop] = useState(true);

  // Position lives in motion values, so moving the mouse doesn't re-render React
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { stiffness: 260, damping: 22 });
  const y = useSpring(mouseY, { stiffness: 260, damping: 22 });

  useEffect(() => {
    // Disable cursor on mobile / touch screens
    if (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches) {
      setIsDesktop(false);
      return;
    }

    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest("[data-cursor]");
      const next = target ? "hover" : "default";

      // Only re-render when the state actually changes
      setVariant((prev) => (prev === next ? prev : next));
      setLabel(target ? target.getAttribute("data-cursor") : "");
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (!isDesktop) return null;

  const size = variant === "hover" ? 80 : 16;

  return (
    <motion.div
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      animate={{
        width: size,
        height: size,
        backgroundColor:
          variant === "hover"
            ? "rgba(47,125,91,0.95)"
            : "rgba(47,125,91,0.7)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full flex items-center justify-center text-white font-semibold"
    >
      {variant === "hover" && (
        <div className="flex flex-col items-center gap-1">

          {/* CLOTH ICON (T-shirt) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M4 7l4-3h8l4 3-2 4-2-1v9H8v-9l-2 1-2-4z" />
          </svg>

          {/* LABEL */}
          {label && (
            <span className="text-[10px] tracking-wide">
              {label}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CustomCursor;
