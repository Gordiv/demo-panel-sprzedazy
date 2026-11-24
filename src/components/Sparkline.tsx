import { useEffect, useId, useRef, useState } from 'react';
import { areaPath, linePath, sparklinePoints } from '../lib/geometry';

interface SparklineProps {
  values: ReadonlyArray<number | null>;
  /** CSS colour (a token) for the line */
  color: string;
  height?: number;
}

/** Tiny trend line drawn in real pixels (crisp stroke); it draws itself in whenever the series changes. */
export function Sparkline({ values, color, height = 44 }: SparklineProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (prev === w ? prev : w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points = width > 0 ? sparklinePoints(values, width, height, 3) : [];
  const line = linePath(points);

  return (
    <div ref={box} className="sparkline" style={{ color, height }} aria-hidden="true">
      {points.length > 1 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} focusable="false">
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* A new key restarts the draw-in animation when the data changes. */}
          <path key={`a${line}`} className="sparkline__area" d={areaPath(points, height)} fill={`url(#${id}-fill)`} />
          <path
            key={`l${line}`}
            className="sparkline__line"
            d={line}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}
