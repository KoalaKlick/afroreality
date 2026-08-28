"use client";
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  options = [],
  value,
  onValueChange,
  onChange,
  placeholder = 'Select option...',
  className,
  disabled,
}: {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (val: string) => void;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const handleChange = (val: string) => {
    onValueChange?.(val);
    onChange?.(val);
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
