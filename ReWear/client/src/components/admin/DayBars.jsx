import { useState } from "react";
import { format, parseISO } from "date-fns";

const dayLabel = (day) => format(parseISO(day), "d MMM");

// One series per chart: a bar per period (days by default), with a hover tooltip
// and a hidden table for screen readers.
const DayBars = ({ title, series, field, formatValue = (v) => v, total, period = "Last 30 days", labelOf = dayLabel, endLabel = "Today" }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...series.map((d) => d[field]));
  const height = 140;
  const slot = 100 / series.length;

  return (
    <figure className="bg-white border border-line rounded-sm p-5 m-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">
          {period} · <span className="font-semibold text-ink">{formatValue(total)}</span>
        </span>
      </figcaption>

      <div className="relative mt-4" style={{ height }} onMouseLeave={() => setHover(null)}>
        {/* Recessive grid: baseline and the max line */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#efe6da]" aria-hidden="true" />
        <span className="absolute right-0 -top-4 text-[10px] text-muted" aria-hidden="true">{formatValue(max)}</span>
        <div className="absolute inset-x-0 bottom-0 border-t border-[#d9cbb9]" aria-hidden="true" />

        <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" className="block">
          {series.map((d, i) => {
            const h = d[field] ? Math.max(3, (d[field] / max) * (height - 4)) : 0;
            return (
              <g key={d.day}>
                {/* Wide invisible hit target */}
                <rect x={i * slot} y={0} width={slot} height={height} fill="transparent" onMouseEnter={() => setHover(i)} />
                {h > 0 && (
                  <rect
                    x={i * slot + slot * 0.15}
                    y={height - h}
                    width={slot * 0.7}
                    height={h}
                    rx={0.6}
                    fill={hover === i ? "#8a5533" : "#b06f3c"}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {hover !== null && (
          <div
            role="tooltip"
            className="absolute -top-2 -translate-y-full -translate-x-1/2 whitespace-nowrap rounded-md bg-ink text-paper text-xs px-2.5 py-1.5 pointer-events-none"
            style={{ left: `${Math.min(92, Math.max(8, (hover + 0.5) * slot))}%` }}
          >
            {labelOf(series[hover].day)} · <span className="font-semibold">{formatValue(series[hover][field])}</span>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden="true">
        <span>{labelOf(series[0].day)}</span>
        <span>{endLabel}</span>
      </div>

      <table className="sr-only">
        <caption>{title}, {period.toLowerCase()}</caption>
        <tbody>
          {series.map((d) => (
            <tr key={d.day}>
              <th scope="row">{labelOf(d.day)}</th>
              <td>{formatValue(d[field])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default DayBars;
