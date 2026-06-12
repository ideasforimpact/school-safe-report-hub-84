
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  /** When true, onChange fires only on Enter key press — no auto-debounce */
  triggerOnEnter?: boolean;
}

const DebouncedSearchInput: React.FC<DebouncedSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  delay = 800,
  className = '',
  triggerOnEnter = false,
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder={triggerOnEnter ? `${placeholder} (press Enter)` : placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="pl-10"
      />
    </div>
  );
};

export default DebouncedSearchInput;
