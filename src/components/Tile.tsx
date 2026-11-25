import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSpotlight } from '../lib/hooks';

interface TileProps {
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}

/**
 * A glass card in the bento grid. The entrance is a CSS animation on the
 * wrapper (transform + opacity only); hover lift and spotlight are on the card.
 */
export function Tile({ className = '', labelledBy, children }: TileProps) {
  const ref = useSpotlight<HTMLDivElement>();
  return (
    <article className={`tile-wrap ${className}`} aria-labelledby={labelledBy}>
      <div ref={ref} className="tile">
        <div className="tile__fx" aria-hidden="true">
          <span className="tile__spot" />
        </div>
        {children}
      </div>
    </article>
  );
}

interface BentoProps {
  children: ReactNode;
  className?: string;
}

/**
 * Grid whose tiles play their entrance once, the first time the grid comes into view.
 * The class is set once and never removed, so scrolling back does not restart anything.
 */
export function Bento({ children, className = '' }: BentoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={ref} className={`bento ${shown ? 'is-in' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface TileHeaderProps {
  id: string;
  title: string;
  icon?: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
}

export function TileHeader({ id, title, icon, subtitle, aside }: TileHeaderProps) {
  return (
    <header className="tile__header">
      <div className="tile__heading">
        {icon ? <span className="tile__icon">{icon}</span> : null}
        <div>
          <h3 id={id} className="tile__title">
            {title}
          </h3>
          {subtitle ? <p className="tile__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {aside ? <div className="tile__aside">{aside}</div> : null}
    </header>
  );
}
