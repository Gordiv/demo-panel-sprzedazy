import { useId, type ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint: string;
  action?: ReactNode;
}

/** Empty results: a small line drawing of an open box with a magnifier. */
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  const gid = `${useId().replace(/:/g, '')}-empty`;
  return (
    <div className="empty">
      <svg className="empty__art" viewBox="0 0 160 120" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--series-1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--series-2)' }} />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="104" rx="52" ry="7" className="empty__shadow" />
        <path d="M38 52 80 36l42 16v38L80 106 38 90Z" className="empty__box" />
        <path d="M38 52 80 68l42-16M80 68v38" className="empty__edge" />
        <path d="M38 52 24 40l42-16 14 12M122 52l14-12-42-16-14 12" className="empty__flap" />
        <circle cx="112" cy="30" r="15" className="empty__lens" stroke={`url(#${gid})`} />
        <path d="m123 41 12 12" className="empty__handle" stroke={`url(#${gid})`} />
        <path d="M18 22h8M22 18v8M140 76h6M143 73v6" className="empty__spark" />
      </svg>
      <p className="empty__title">{title}</p>
      <p className="empty__hint">{hint}</p>
      {action}
    </div>
  );
}
