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
 * Pointer-following light on a tile. A pre-painted gradient disc (`.tile__spot`) is moved
 * with a compositor-only transform straight from the pointer event, so it never lags a
 * frame behind. The tile's position is read once on enter and again only after a scroll,
 * a resize or the end of the hover lift; moves themselves do no layout reads.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover)').matches) return;
    const spot = el.querySelector<HTMLElement>('.tile__spot');
    if (!spot) return;
    let left = 0;
    let top = 0;
    let half = 0;
    let stale = true;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
      half = spot.offsetWidth / 2;
      stale = false;
    };
    const place = (x: number, y: number) => {
      if (stale) measure();
      spot.style.transform = `translate(${x - left - half}px, ${y - top - half}px)`;
    };
    const invalidate = () => {
      stale = true;
    };
    const onMove = (e: PointerEvent) => place(e.clientX, e.clientY);
    const onEnter = (e: PointerEvent) => {
      stale = true;
      place(e.clientX, e.clientY);
      el.classList.add('is-lit');
      window.addEventListener('scroll', invalidate, { passive: true });
    };
    const onLeave = () => {
      el.classList.remove('is-lit');
      window.removeEventListener('scroll', invalidate);
    };
    const onLiftEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === 'transform') stale = true;
    };

    el.addEventListener('pointerenter', onEnter, { passive: true });
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    el.addEventListener('transitionend', onLiftEnd, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('transitionend', onLiftEnd);
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
