import { useId } from 'react';
import { motion } from 'motion/react';
import { useMotionEnabled } from '../lib/motion';
import { Icon, type IconName } from './Icon';

export interface NavSection {
  id: string;
  label: string;
  icon: IconName;
}

interface SidebarProps {
  sections: readonly NavSection[];
  active: string;
}

export function LogoMark({ size = 36 }: { size?: number }) {
  // Each instance needs its own gradient id: one copy may sit in a hidden (display: none) container.
  const gid = `${useId().replace(/:/g, '')}-logo`;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false" className="logo-mark">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--series-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--series-2)' }} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill={`url(#${gid})`} />
      <path d="M11 27.5 17 20l5 4.5 7.5-10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29.5" cy="14.5" r="2.6" fill="#fff" />
    </svg>
  );
}

/** Rail on wide screens, floating bottom bar on narrow ones. The pill follows the section in view. */
export function Sidebar({ sections, active }: SidebarProps) {
  const animate = useMotionEnabled();
  return (
    <nav className="sidebar glass-bar" aria-label="Sekcje panelu">
      <div className="sidebar__logo">
        <LogoMark />
      </div>
      <ul className="sidebar__list">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className={`sidebar__link${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'location' : undefined}>
                {isActive ? (
                  <motion.span
                    layoutId={animate ? 'nav-pill' : undefined}
                    className="sidebar__pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon name={s.icon} size={20} />
                <span className="sidebar__label">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
