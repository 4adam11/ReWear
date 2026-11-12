import { useCallback } from "react";

// react-date-range draws icon-only arrows and unlabelled month/year menus, and
// booked or past days look greyed out but aren't marked as unavailable.
// This names them for screen readers, and keeps doing so as the calendar re-renders.
const label = (root) => {
  const set = (selector, name) =>
    root.querySelectorAll(selector).forEach((el) => {
      if (el.getAttribute("aria-label") !== name) el.setAttribute("aria-label", name);
    });

  set(".rdrPprevButton", "Previous month");
  set(".rdrNextButton", "Next month");
  set(".rdrMonthPicker select", "Month");
  set(".rdrYearPicker select", "Year");
  set(".rdrDateDisplayItem:first-child input", "Start date");
  set(".rdrDateDisplayItem:last-child input", "End date");

  root.querySelectorAll(".rdrDay").forEach((day) => {
    const off = day.classList.contains("rdrDayDisabled") || day.classList.contains("rdrDayPassive");
    if (off && day.getAttribute("aria-disabled") !== "true") day.setAttribute("aria-disabled", "true");
    if (!off && day.hasAttribute("aria-disabled")) day.removeAttribute("aria-disabled");
  });
};

// Returns a ref for the element that wraps <DateRange>. It works even when the
// calendar appears later (React 19 runs the returned cleanup when it goes away).
const useCalendarLabels = () =>
  useCallback((root) => {
    if (!root) return;
    label(root);
    const observer = new MutationObserver(() => label(root));
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

export default useCalendarLabels;
