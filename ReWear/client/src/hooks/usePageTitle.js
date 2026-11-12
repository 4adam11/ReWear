import { useEffect } from "react";

const SITE = "ReWear: buy and rent pre-loved Indian fashion";
const DEFAULT_DESCRIPTION =
  "Buy or rent pre-loved Indian fashion: wedding, party, ethnic and designer wear. Every listing is checked by the ReWear team.";

// Search results show about 160 characters; cut at a word, not mid-word
const clip = (text, max = 160) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s.,;:·-]+$/, "")}…`;
};

// Find or create a <meta> tag in <head>
const meta = (attr, key) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  return tag;
};

// Sets the browser tab title, e.g. "Your bag · ReWear", and optionally the page's
// description, which search results and link previews (WhatsApp, Instagram) show.
const usePageTitle = (title, description) => {
  useEffect(() => {
    const full = title ? `${title} · ReWear` : SITE;
    const text = clip((description || DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim());

    document.title = full;
    meta("name", "description").setAttribute("content", text);
    meta("property", "og:title").setAttribute("content", full);
    meta("property", "og:description").setAttribute("content", text);
  }, [title, description]);
};

export default usePageTitle;
