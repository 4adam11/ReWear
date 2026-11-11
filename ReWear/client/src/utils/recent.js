// The last few listings this browser opened, newest first (ids only; details are fetched fresh)
const KEY = "rewear-recently-viewed";
const MAX = 12;

export const readViewed = () => {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
};

export const recordView = (id) => {
  try {
    const ids = [id, ...readViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked: the row just won't show
  }
};
