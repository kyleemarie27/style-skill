interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  kind?: string;
  label?: string;
}

/** Single-select chip row; tapping the active chip clears it. */
export function ChipGroup<T extends string>({ options, value, onChange, kind = "", label }: Props<T>) {
  return (
    <div role="group" aria-label={label}>
      {label && <div className="field-label">{label}</div>}
      <div className="chips">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip ${kind}`}
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiChips({
  options, value, onChange, kind = "", label,
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; kind?: string; label?: string }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const extra = value.filter((v) => !options.includes(v));
  return (
    <div role="group" aria-label={label}>
      {label && <div className="field-label">{label}</div>}
      <div className="chips">
        {[...options, ...extra].map((o) => (
          <button key={o} type="button" className={`chip ${kind}`} aria-pressed={value.includes(o)} onClick={() => toggle(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
