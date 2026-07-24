
import React from 'react';
import DebouncedSearchInput from '@/components/backoffice/DebouncedSearchInput';

interface ClientSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ClientSearchBar = ({
  value,
  onChange,
  placeholder = 'Search by name, contact person, email, or institution type',
}: ClientSearchBarProps) => {
  return (
    <DebouncedSearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      ariaLabel="Search clients"
      triggerOnEnter
      className="w-full sm:flex-1"
    />
  );
};

export default ClientSearchBar;
