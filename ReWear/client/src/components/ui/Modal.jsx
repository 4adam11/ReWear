import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A centred dialog (a bottom sheet on phones). Escape, the close button or a click
// outside closes it, Tab stays inside it, and focus goes back to whatever opened it.
const Modal = ({ title, onClose, children, wide = false }) => {
  const boxRef = useRef();
  const closeRef = useRef();
  const titleId = useId();
  // Latest onClose without re-running the setup below (which would move focus)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !boxRef.current) return;

      // Keep keyboard focus inside the dialog
      const items = [...boxRef.current.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`enter w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[90vh] flex flex-col bg-white rounded-t-sm sm:rounded-sm shadow-lift`}
      >
        <div className="flex items-center justify-between gap-4 pl-5 pr-2 py-2 border-b border-line">
          <h2 id={titleId} className="py-2 text-lg font-bold uppercase tracking-[0.04em]">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 rounded-full flex items-center justify-center text-ink hover:bg-cream transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
