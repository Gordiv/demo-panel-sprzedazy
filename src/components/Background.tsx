/** Slowly drifting colour fields behind the glass, plus a fine grain. Purely decorative. */
export function Background() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora__blob aurora__blob--1" />
      <span className="aurora__blob aurora__blob--2" />
      <span className="aurora__blob aurora__blob--3" />
      <span className="aurora__blob aurora__blob--4" />
      <span className="aurora__grain" />
    </div>
  );
}
