import { useId, useState } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label?: string;
  placeholder?: string;
  /** Text currently typed in the input */
  query: string;
  onQueryChange: (query: string) => void;
  /** Options to show; filtering is done by the caller */
  options: ComboboxOption[];
  selected: ComboboxOption | null;
  onSelect: (option: ComboboxOption | null) => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Text input with a dropdown of matching options (typeahead). */
export function Combobox({
  label,
  placeholder,
  query,
  onQueryChange,
  options,
  selected,
  onSelect,
  loading = false,
  disabled = false,
}: ComboboxProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm">
          <span className="min-w-0 break-words text-indigo-800">{selected.label}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex-shrink-0 text-indigo-500 hover:text-indigo-700 leading-none"
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            id={inputId}
            value={query}
            disabled={disabled}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // Delay so a click on an option registers before the list closes
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            autoComplete="off"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-indigo-400 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          {open && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
              {!loading && options.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
              )}
              {!loading &&
                options.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelect(opt);
                        setOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 break-words hover:bg-indigo-50"
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
