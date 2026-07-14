
import React from 'react';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';

interface VehicleSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const VehicleSearchBar: React.FC<VehicleSearchBarProps> = ({
  searchQuery,
  setSearchQuery
}) => {
  return (
    <DebouncedSearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search vehicles by registration or model..."
      className="w-full md:w-[280px] lg:w-[320px]"
      maxLength={50}
      triggerOnEnter
    />
  );
};

export default VehicleSearchBar;
