import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Check, Search } from 'lucide-react';

export interface SearchMultiSelectOption {
  id: string;
  label: string;
  description?: string | null;
}

interface SearchMultiSelectProps {
  options: SearchMultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional custom renderer for option row */
  renderOptionContent?: (option: SearchMultiSelectOption, isSelected: boolean) => React.ReactNode;
  /** Optional className override for the root */
  className?: string;
}

const SearchMultiSelect: React.FC<SearchMultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  renderOptionContent,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const term = query.toLowerCase();
    return options.filter((opt) => {
      const inLabel = opt.label.toLowerCase().includes(term);
      const inDesc = (opt.description || '').toLowerCase().includes(term);
      return inLabel || inDesc;
    });
  }, [options, query]);

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((v) => v !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-8"
      />
      <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()} // prevent input blur
                  onClick={() => toggleId(opt.id)}
                >
                  <div className="flex flex-col items-start">
                    {renderOptionContent ? (
                      renderOptionContent(opt, isSelected)
                    ) : (
                      <>
                        <span className="font-medium text-gray-900">{opt.label}</span>
                        {opt.description && (
                          <span className="text-xs text-gray-500">{opt.description}</span>
                        )}
                      </>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchMultiSelect;


