import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

function isVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(isVisible);
  useEffect(() => {
    const update = () => setVisible(isVisible());
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

/**
 * JavaScript-driven motion runs only when the user allows motion and the page
 * is on screen; otherwise widgets render their final state straight away.
 */
export function useMotionEnabled(): boolean {
  const reduced = useReducedMotion();
  const visible = useDocumentVisible();
  return !reduced && visible;
}
