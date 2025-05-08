
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface VehicleSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const VehicleSearchBar: React.FC<VehicleSearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery 
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search vehicles by registration or model..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};

export default VehicleSearchBar;
