import Modal from "../ui/Modal";
import { MEASUREMENTS } from "../../utils/catalog";

// Typical body measurements for each size, in inches. Brands differ, so this is a guide only;
// a listing's own measurements (when the seller added them) are the ones to trust.
const WOMEN = [
  ["S", "32–34", "26–28", "35–37"],
  ["M", "34–36", "28–30", "37–39"],
  ["L", "36–38", "30–32", "39–41"],
  ["XL", "38–40", "32–34", "41–43"],
  ["XXL", "40–42", "34–36", "43–45"],
];

const MEN = [
  ["S", "36–38", "30–32"],
  ["M", "38–40", "32–34"],
  ["L", "40–42", "34–36"],
  ["XL", "42–44", "36–38"],
  ["XXL", "44–46", "38–40"],
];

const HOW_TO = [
  ["Bust / chest", "around the fullest part, tape level under the arms"],
  ["Waist", "around the narrowest part, above the navel"],
  ["Hips", "around the fullest part, feet together"],
  ["Length", "from the highest shoulder point down to the hem"],
];

const Chart = ({ caption, head, rows, current }) => (
  <table className="w-full text-sm">
    <caption className="mb-2 text-left font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted">{caption}</caption>
    <thead>
      <tr className="border-b border-line text-left text-xs text-muted">
        {head.map((h) => (
          <th key={h} scope="col" className="py-2 pr-3 font-medium">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(([size, ...cells]) => (
        <tr key={size} className={`border-b border-[#efe6da] ${size === current ? "bg-cream font-semibold" : ""}`}>
          <th scope="row" className="py-2 pr-3 pl-2 text-left">
            {size}
            {size === current && <span className="sr-only"> (this item's size)</span>}
          </th>
          {cells.map((c, i) => (
            <td key={i} className="py-2 pr-3">{c}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const SizeGuide = ({ product, onClose }) => {
  const measured = MEASUREMENTS.filter(({ key }) => product.measurements?.[key] > 0);

  return (
    <Modal title="Size guide" onClose={onClose} wide>
      <div className="flex flex-col gap-6">
        {measured.length > 0 ? (
          <div className="rounded-sm border border-line bg-cream p-4">
            <p className="text-sm font-semibold">This item, measured by the seller (size {product.size})</p>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {measured.map(({ key, label }) => (
                <div key={key}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-semibold">{product.measurements[key]} in</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted">
            The seller hasn't added measurements for this item. It's listed as size <strong className="text-ink">{product.size}</strong>; message the seller if you need exact numbers.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Chart caption="Women (inches)" head={["Size", "Bust", "Waist", "Hips"]} rows={WOMEN} current={product.size} />
          <Chart caption="Men (inches)" head={["Size", "Chest", "Waist"]} rows={MEN} current={product.size} />
        </div>

        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted">How to measure yourself</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {HOW_TO.map(([name, how]) => (
              <li key={name}>
                <strong>{name}:</strong> {how}.
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            These are typical ranges and vary by brand and tailor. Pre-loved pieces may also have been altered, so compare with the item's own measurements when they're shown.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default SizeGuide;
