// Messages and confirmations that look like ReWear, instead of the browser's
// alert() and confirm() boxes. <FeedbackHost /> (mounted once in App.jsx) draws them.
//
//   toast("Price updated")                     - a short note at the bottom of the screen
//   toast.error("Couldn't save that")          - same, in Sindoor, read out straight away
//   flash("Your session has expired...")       - shown after the next full page load
//   if (await confirmAction({ title, body, confirmLabel, danger })) { ... }

const listeners = new Set();
let nextId = 1;
const FLASH_KEY = "rewear-flash";

const emit = (event) => listeners.forEach((fn) => fn(event));

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function toast(message, tone = "info", action) {
  emit({ type: "toast", id: nextId++, message, tone, action });
}
toast.success = (message, action) => toast(message, "success", action);
toast.error = (message, action) => toast(message, "danger", action);

// Survives window.location changes (for example after a forced logout)
export function flash(message, tone = "info") {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, tone }));
  } catch {
    // storage blocked: the message is lost, the redirect still works
  }
}

export function takeFlash() {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    sessionStorage.removeItem(FLASH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function confirmAction({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    emit({ type: "confirm", id: nextId++, title, body, confirmLabel, cancelLabel, danger, resolve });
  });
}
