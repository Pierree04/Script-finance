import type { ReactNode } from 'react';

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Habillage commun d'un champ : libellé, astérisque obligatoire, erreur. */
function FieldWrapper({
  label,
  required,
  error,
  hint,
  children,
}: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-500">
          {error}
        </span>
      )}
    </label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export function TextField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  placeholder,
}: TextFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <input
        type="text"
        className="input-base"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
    </FieldWrapper>
  );
}

interface NumberFieldProps {
  label: string;
  /** Valeur saisie sous forme de chaîne (pour autoriser la saisie partielle). */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  suffix?: string;
  placeholder?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  suffix,
  placeholder,
}: NumberFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className="input-base pr-10"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  required,
  error,
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required} error={error}>
      <select
        className="input-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label}>
      <textarea
        className="input-base min-h-[72px] resize-y"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}
