import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// A simple centred dialog. Escape, the close button or a click outside closes it,
// and focus goes back to whatever opened it.
const Modal = ({ title, onClose, children, wide = false }) => {
  const closeRef = useRef();

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[90vh] flex flex-col bg-white rounded-t-lg sm:rounded-sm shadow-lift`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line">
          <h2 id="modal-title" className="text-lg font-bold uppercase tracking-[0.04em]">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-ink hover:bg-cream"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
