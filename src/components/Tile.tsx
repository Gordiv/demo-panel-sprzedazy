import type { ReactNode } from 'react';
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
        {children}
      </div>
    </article>
  );
}

interface BentoProps {
  children: ReactNode;
  className?: string;
}

export function Bento({ children, className = '' }: BentoProps) {
  return <div className={`bento ${className}`}>{children}</div>;
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
