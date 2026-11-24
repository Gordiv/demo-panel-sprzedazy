import { useLayoutEffect, useRef } from 'react';
import { countUpValue, easeOutCubic } from '../lib/animation';
import { useMotionEnabled } from '../lib/motion';

interface AnimatedNumberProps {
  value: number | null;
  /** Must be a stable function (module level), it runs on every frame */
  format: (value: number | null) => string;
  duration?: number;
  className?: string;
}

/**
 * Counts from the previously shown value to the new one. Frames write to the
 * DOM directly, so React does not re-render 60 times a second. Screen readers
 * get the final value only.
 */
export function AnimatedNumber({ value, format, duration = 1000, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const reduced = !useMotionEnabled();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === null || reduced || document.visibilityState === 'hidden') {
      el.textContent = format(value);
      shown.current = value;
      return;
    }
    const from = shown.current ?? 0;
    if (from === value) {
      el.textContent = format(value);
      return;
    }
    el.textContent = format(from);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = countUpValue(from, value, now - start, duration, easeOutCubic);
      shown.current = next;
      el.textContent = format(next);
      if (next !== value) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, format, duration, reduced]);

  return (
    <>
      <span ref={ref} className={className} aria-hidden="true">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
