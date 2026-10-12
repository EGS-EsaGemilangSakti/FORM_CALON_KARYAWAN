import type { ReactNode } from 'react';

interface FieldShellProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ label, error, children, className = '' }: FieldShellProps) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-2 block text-sm font-semibold tracking-[0.05em] text-[#f2ca50]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-accent">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full min-w-0 border border-[#99907c]/20 bg-white px-4 py-3 text-base text-[#1c1b1b] outline-none transition placeholder:text-[#5d5a55] focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/25 disabled:bg-slate-100';
