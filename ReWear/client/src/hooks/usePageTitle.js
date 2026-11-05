import { useEffect } from "react";

// Sets the browser tab title, e.g. "Your bag · ReWear"
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ReWear` : "ReWear: buy and rent pre-loved Indian fashion";
  }, [title]);
};

export default usePageTitle;
