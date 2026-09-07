
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  /** When true, onChange fires only on Enter key press — no auto-debounce */
  triggerOnEnter?: boolean;
  maxLength?: number;
}

const DebouncedSearchInput: React.FC<DebouncedSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  delay = 800,
  className = '',
  triggerOnEnter = false,
  maxLength,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when parent clears or resets the value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);

    if (triggerOnEnter) {
      // Auto-clear immediately when input is emptied — no Enter needed
      if (next === '') onChange('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (triggerOnEnter && e.key === 'Enter') {
      onChange(localValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange('');
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={localValue ? 'pl-10 pr-9' : 'pl-10'}
        maxLength={maxLength}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default DebouncedSearchInput;
