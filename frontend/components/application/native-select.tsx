'use client'

import { cx } from '@/utils/cx'

type SelectOption = {
  value: string
  label: string
}

type NativeSelectProps = {
  id?: string
  label?: string
  name?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  isDisabled?: boolean
  className?: string
  placeholder?: string
}

export function NativeSelect({
  id,
  label,
  name,
  value,
  onChange,
  options,
  isDisabled,
  className,
  placeholder,
}: NativeSelectProps) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      {label ? (
        <span className="text-sm font-medium text-secondary">{label}</span>
      ) : null}
      <select
        id={id}
        name={name}
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-10 w-full rounded-lg bg-primary px-3 text-md text-primary shadow-xs ring-1 ring-primary outline-none',
          'focus-visible:ring-2 focus-visible:ring-brand',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
