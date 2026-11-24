import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/** Sun that turns into a moon: the core grows, a shadow disc slides in, the rays retract. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === 'dark';
  const maskId = useId();
  const reduced = useReducedMotion();
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 22 };

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      onClick={onToggle}
      aria-pressed={dark}
      aria-label="Ciemny motyw"
      title="Przełącz motyw (T)"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            r="8"
            fill="black"
            initial={false}
            animate={dark ? { cx: 17, cy: 7 } : { cx: 30, cy: -6 }}
            transition={spring}
          />
        </mask>
        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: dark ? 8.5 : 4.6 }}
          transition={spring}
        />
        <motion.g
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? -60 : 0, scale: dark ? 0.4 : 1 }}
          style={{ originX: '12px', originY: '12px' }}
          transition={spring}
        >
          {RAYS.map((deg) => (
            <line key={deg} x1="12" y1="2.6" x2="12" y2="4.6" transform={`rotate(${deg} 12 12)`} />
          ))}
        </motion.g>
      </svg>
    </button>
  );
}
