import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionEnabled } from '../lib/motion';
import { Icon, type IconName } from './Icon';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface SelectProps<V extends string> {
  label: string;
  icon: IconName;
  value: V;
  options: ReadonlyArray<SelectOption<V>>;
  onChange: (value: V) => void;
}

/**
 * Custom listbox (button + popup) following the ARIA "select-only combobox"
 * pattern: arrows, Home/End, Enter/Space, Escape and type-to-find.
 */
export function Select<V extends string>({ label, icon, value, options, onChange }: SelectProps<V>) {
  const id = useId();
  const animate = useMotionEnabled();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = performance.now();
          typed.current.text = now - typed.current.at > 600 ? e.key : typed.current.text + e.key;
          typed.current.at = now;
          const needle = typed.current.text.toLocaleLowerCase('pl-PL');
          const found = options.findIndex((o) => o.label.toLocaleLowerCase('pl-PL').startsWith(needle));
          if (found >= 0) setActive(found);
        }
    }
  };

  return (
    <div className="select" ref={rootRef}>
      <span className="field-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        className={`select__button${value !== options[0]?.value ? ' is-filtered' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <Icon name={icon} size={16} className="select__icon" />
        <span id={`${id}-value`} className="select__value">
          {selected?.label}
        </span>
        <Icon name="chevronDown" size={16} className={`select__chevron${open ? ' is-open' : ''}`} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="select__list glass-pop"
            initial={animate ? { opacity: 0, y: -6, scale: 0.98 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={animate ? { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } } : { opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                className={`select__option${i === active ? ' is-active' : ''}`}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                <span>{o.label}</span>
                {o.value === value ? <Icon name="check" size={15} /> : null}
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
