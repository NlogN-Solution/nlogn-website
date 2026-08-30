/**
 * The signature motif: an actual n·log(n) curve.
 * The company is named after the complexity class, so every growth line on the
 * site is plotted from the function rather than drawn by hand.
 */
export function nlognPath(width: number, height: number, samples = 64, padding = 0) {
  const n0 = 1.6;
  const n1 = 26;
  const f = (n: number) => n * Math.log2(n);
  const yMin = f(n0);
  const yMax = f(n1);
  const w = width - padding * 2;
  const h = height - padding * 2;

  const points: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const n = n0 + (n1 - n0) * t;
    const y = (f(n) - yMin) / (yMax - yMin);
    points.push([padding + t * w, padding + h - y * h]);
  }

  // Catmull-Rom to cubic Bézier keeps the curve smooth at low sample counts.
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/** Point on the curve at t ∈ [0,1], in the same coordinate space as nlognPath. */
export function nlognPoint(width: number, height: number, t: number, padding = 0) {
  const n0 = 1.6;
  const n1 = 26;
  const f = (n: number) => n * Math.log2(n);
  const yMin = f(n0);
  const yMax = f(n1);
  const n = n0 + (n1 - n0) * t;
  const y = (f(n) - yMin) / (yMax - yMin);
  return {
    x: padding + t * (width - padding * 2),
    y: padding + (height - padding * 2) - y * (height - padding * 2),
  };
}

type Props = {
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
  animate?: boolean;
  fill?: boolean;
  id?: string;
};

export function GrowthCurve({
  width = 400,
  height = 160,
  className,
  strokeWidth = 2.5,
  animate = true,
  fill = false,
  id = "curve",
}: Props) {
  const d = nlognPath(width, height, 64, strokeWidth);
  const area = `${d} L ${width - strokeWidth} ${height} L ${strokeWidth} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#6c47ff" />
          <stop offset="100%" stopColor="#4526c9" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c47ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6c47ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id}-fill)`} />}
      <path
        d={d}
        stroke={`url(#${id}-stroke)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={
          animate
            ? {
                strokeDasharray: 2000,
                strokeDashoffset: 2000,
                animation: "draw 2.2s cubic-bezier(0.16,1,0.3,1) 0.35s forwards",
              }
            : undefined
        }
      />
    </svg>
  );
}
