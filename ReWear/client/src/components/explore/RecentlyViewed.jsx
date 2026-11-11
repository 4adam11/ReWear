import { useEffect, useState } from "react";
import axios from "axios";

import API from "../../utils/api";
import { readViewed } from "../../utils/recent";
import ProductCard from "./ProductCard";

// A swipeable row of the listings this visitor opened most recently.
// Shows nothing until there is at least one (other than `exclude`, the page being viewed).
const RecentlyViewed = ({ exclude, centered = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const ids = readViewed().filter((id) => id !== exclude);
    if (!ids.length) return;

    let ignore = false;
    axios
      .get(`${API}/products/by-ids`, { params: { ids: ids.join(",") } })
      .then(({ data }) => !ignore && setItems(data))
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [exclude]);

  if (!items.length) return null;

  return (
    <section aria-labelledby="recent-h">
      <h2
        id="recent-h"
        className={
          centered
            ? "mb-6 text-center text-[26px] sm:text-3xl font-bold uppercase tracking-[0.06em]"
            : "mb-4 text-[22px] font-bold tracking-tight"
        }
      >
        Recently viewed
      </h2>
      {/* Centred under a centred heading when there are only a few; still scrolls when there are many */}
      <div className={`scroll-row flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 ${centered ? "w-fit max-w-full mx-auto" : "-mr-4 pr-4 sm:mr-0 sm:pr-0"}`}>
        {items.map((p) => (
          <div key={p._id} className="snap-start flex-shrink-0 w-[150px] sm:w-[190px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
