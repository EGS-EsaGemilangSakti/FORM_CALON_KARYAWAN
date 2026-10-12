import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { inputClass } from './FieldShell';

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchableSelectProps {
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: SearchableSelectOption[];
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  onChange: (value: string) => void;
}

export function SearchableSelect({
  value,
  placeholder,
  searchPlaceholder,
  options,
  disabled = false,
  loading = false,
  loadingText = 'Memuat data',
  emptyText = 'Data tidak ditemukan',
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystack = `${option.label} ${option.searchText ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [isOpen]);

  const openDropdown = () => {
    if (disabled || loading) return;
    setIsOpen((current) => !current);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className={`${inputClass} flex min-w-0 items-center justify-between gap-3 text-left`}
        disabled={disabled || loading}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={openDropdown}
      >
        <span className={selectedOption ? 'min-w-0 truncate' : 'min-w-0 truncate text-[#5d5a55]'}>
          {loading ? loadingText : selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#5d5a55] transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 min-w-0 overflow-hidden rounded-md border border-[#f2ca50]/35 bg-white shadow-xl shadow-black/25">
          <div className="flex items-center gap-2 border-b border-[#99907c]/20 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#5d5a55]" aria-hidden="true" />
            <input
              ref={searchInputRef}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#1c1b1b] outline-none placeholder:text-[#5d5a55]"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                  setQuery('');
                }
              }}
            />
          </div>
          <div id={listboxId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`block w-full min-w-0 break-words px-4 py-3 text-left text-sm transition hover:bg-[#f2ca50]/15 ${
                    option.value === value ? 'bg-[#f2ca50]/20 font-semibold text-[#1c1b1b]' : 'text-[#1c1b1b]'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-[#5d5a55]">{emptyText}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
