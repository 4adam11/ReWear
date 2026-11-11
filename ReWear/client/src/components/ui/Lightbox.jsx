import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { thumb, cardImage } from "../../utils/image";

// Full-screen photo viewer. Arrow keys or the side buttons move between photos,
// Escape or the close button (or a click on the dark area) closes it.
const Lightbox = ({ images, start = 0, alt, onClose }) => {
  const [index, setIndex] = useState(start);
  const closeRef = useRef();
  const many = images.length > 1;

  const step = (by) => setIndex((i) => (i + by + images.length) % images.length);

  useEffect(() => {
    // Remember what had focus so it can be given back on close
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };

    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [images.length, onClose]);

  const navButton = "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${alt}`}
      className="fixed inset-0 z-[70] bg-black/85 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm">
          {many ? `${index + 1} of ${images.length}` : ""}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/15"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
        <img
          src={thumb(images.at(index), 1600)}
          alt={many ? `${alt}, photo ${index + 1}` : alt}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full object-contain"
        />

        {many && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className={`${navButton} left-3 sm:left-6`}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className={`${navButton} right-3 sm:right-6`}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="flex justify-center gap-2 px-4 pb-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-pressed={i === index}
              className={`flex-shrink-0 w-12 h-16 overflow-hidden ${i === index ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
            >
              <img src={cardImage(img, 100)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lightbox;
