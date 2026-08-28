"use client";
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  minimal?: boolean;
  disabled?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write something...',
  className,
  minHeight = '120px',
  minimal,
  disabled,
}: RichTextEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ minHeight: minimal ? '80px' : minHeight }}
      className={cn(
        'w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  );
}
