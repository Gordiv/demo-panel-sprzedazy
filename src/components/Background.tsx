import { useEffect, useRef } from 'react';

/**
 * Slowly drifting colour fields behind the glass, plus a fine grain. Purely decorative.
 * While the page scrolls, the drift pauses and a transparent shield takes the pointer
 * (so nothing re-paints because of hover). Only these two elements change class, so
 * the browser restyles two nodes, not the whole page.
 */
export function Background() {
  const aurora = useRef<HTMLDivElement>(null);
  const shield = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer = 0;
    const set = (on: boolean) => {
      aurora.current?.classList.toggle('is-scrolling', on);
      shield.current?.classList.toggle('is-on', on);
    };
    const onScroll = () => {
      if (!timer) set(true);
      else window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        set(false);
      }, 160);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div ref={aurora} className="aurora" aria-hidden="true">
        <span className="aurora__blob aurora__blob--1" />
        <span className="aurora__blob aurora__blob--2" />
        <span className="aurora__blob aurora__blob--3" />
        <span className="aurora__blob aurora__blob--4" />
      </div>
      <div ref={shield} className="scroll-shield" aria-hidden="true" />
    </>
  );
}
