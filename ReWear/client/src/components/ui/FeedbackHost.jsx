import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";

import Modal from "./Modal";
import { subscribe, takeFlash } from "../../utils/feedback";

const ICONS = { success: CircleCheck, danger: CircleAlert, info: Info };
const ICON_COLOUR = { success: "text-success-ondark", danger: "text-danger-ondark", info: "text-gold" };

const Toast = ({ t, onDismiss: dismissById }) => {
  const Icon = ICONS[t.tone] || Info;
  const onDismiss = useCallback(() => dismissById(t.id), [dismissById, t.id]);

  useEffect(() => {
    // Errors stay a little longer so there's time to read them
    const timer = setTimeout(onDismiss, t.tone === "danger" ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [t, onDismiss]);

  return (
    <div className="enter pointer-events-auto flex items-start gap-3 w-full sm:w-[380px] rounded-sm bg-ink text-paper pl-4 pr-1 py-1 shadow-menu">
      <Icon size={18} className={`mt-3 flex-shrink-0 ${ICON_COLOUR[t.tone] || ICON_COLOUR.info}`} aria-hidden="true" />
      <p className="flex-1 py-2.5 text-sm leading-snug">
        {t.message}
        {t.action && (
          <Link to={t.action.to} state={t.action.state} onClick={onDismiss} className="ml-2 font-semibold text-gold underline underline-offset-2">
            {t.action.label}
          </Link>
        )}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-ondark-muted hover:text-paper"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ConfirmDialog = ({ c, onDone }) => {
  const close = useCallback(() => onDone(false), [onDone]);
  return (
    <Modal title={c.title} onClose={close}>
      {c.body && <p className="text-sm text-ink-soft leading-relaxed">{c.body}</p>}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" onClick={close} className="btn btn-outline btn-sm">
          {c.cancelLabel}
        </button>
        <button type="button" onClick={() => onDone(true)} className={`btn btn-sm ${c.danger ? "btn-danger" : "btn-dark"}`}>
          {c.confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

// Mounted once, inside the router, so toast actions can be links
const FeedbackHost = () => {
  const [toasts, setToasts] = useState(() => {
    const f = takeFlash();
    return f ? [{ id: 0, ...f }] : [];
  });
  const [confirmBox, setConfirmBox] = useState(null);

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === "toast") setToasts((list) => [...list.slice(-2), e]);
        else setConfirmBox(e);
      }),
    []
  );

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const answer = useCallback(
    (yes) => {
      confirmBox?.resolve(yes);
      setConfirmBox(null);
    },
    [confirmBox]
  );

  return (
    <>
      {/* Polite for notes, assertive for errors, so screen readers hear them too */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center sm:items-end gap-2 p-4 sm:p-6">
        <div role="status" aria-live="polite" className="flex flex-col items-center sm:items-end gap-2 w-full">
          {toasts.filter((t) => t.tone !== "danger").map((t) => (
            <Toast key={t.id} t={t} onDismiss={dismiss} />
          ))}
        </div>
        <div role="alert" className="flex flex-col items-center sm:items-end gap-2 w-full">
          {toasts.filter((t) => t.tone === "danger").map((t) => (
            <Toast key={t.id} t={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
      {confirmBox && <ConfirmDialog c={confirmBox} onDone={answer} />}
    </>
  );
};

export default FeedbackHost;
