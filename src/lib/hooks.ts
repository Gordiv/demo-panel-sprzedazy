import { useEffect, useRef, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Pointer-following light on a tile. The element's position is measured on
 * enter and after scrolling only; moves just update two CSS variables once per frame.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover)').matches) return;
    let left = 0;
    let top = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let stale = true;

    const apply = () => {
      frame = 0;
      if (stale) {
        const rect = el.getBoundingClientRect();
        left = rect.left;
        top = rect.top;
        stale = false;
      }
      el.style.setProperty('--mx', `${x - left}px`);
      el.style.setProperty('--my', `${y - top}px`);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const invalidate = () => {
      stale = true;
    };

    el.addEventListener('pointerenter', invalidate);
    el.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', invalidate);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, []);

  return ref;
}

/** Id of the section currently in the reading zone of the viewport. */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = key.split('|').find((id) => visible.get(id));
        if (first) setActive(first);
      },
      // A thin band a bit above the middle of the screen decides which section is "current".
      { rootMargin: '-35% 0px -60% 0px' },
    );
    for (const id of key.split('|')) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}
