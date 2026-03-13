import { SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

/**
 * Generic base Select component. To create a specific select (e.g. RoleSelect),
 * wrap this component and pass a fixed `options` array:
 *
 * export function RoleSelect(props: Omit<SelectProps, 'options'>) {
 *   return <Select {...props} options={ROLE_OPTIONS} />;
 * }
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { options, label, error, helperText, placeholder, onChange, className = '', id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          {...props}
          onChange={(e) => onChange?.(e.target.value)}
          className={[
            'block w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            'transition-colors duration-150',
            hasError
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
              : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={hasError}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
