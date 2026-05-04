// Tiny dependency-free SVG sparkline. We don't need a charting lib for a
// 7-bar trend — keeping the bundle thin matters more than feature breadth.

import { cn } from "@/lib/utils";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
};

export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = "var(--color-accent)",
  fill = "color-mix(in oklab, var(--color-accent) 18%, transparent)",
  className,
}: Props) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
