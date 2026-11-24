import type { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';

interface PresenceProps {
  enabled: boolean;
  children: ReactNode;
}

/**
 * Exit animations only while motion is on. Without it, removed items leave
 * at once instead of waiting for animation frames that may never come
 * (reduced motion, or a page in a background tab).
 */
export function Presence({ enabled, children }: PresenceProps) {
  return enabled ? (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  ) : (
    <>{children}</>
  );
}
