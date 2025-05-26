
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchFilter from './SearchFilter';

interface BasicFiltersProps {
  filters: {
    search: string;
    location: string;
    status: string;
    category: string;
    subcategory: string;
    priority: string;
  };
  onFilterChange: (field: string, value: any) => void;
  availableLocations: string[];
  availableCategories: string[];
  availableSubcategories: string[];
  statusOptions?: string[];
  priorityOptions?: string[];
}

const BasicFilters: React.FC<BasicFiltersProps> = ({
  filters,
  onFilterChange,
  availableLocations,
  availableCategories,
  availableSubcategories,
  statusOptions = [],
  priorityOptions = []
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchFilter 
          value={filters.search} 
          onChange={(value) => onFilterChange('search', value)} 
        />
        
        <Select 
          value={filters.location} 
          onValueChange={(value) => onFilterChange('location', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="">All Locations</SelectItem>
            {availableLocations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.status} 
          onValueChange={(value) => onFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="">All Statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Select 
          value={filters.category} 
          onValueChange={(value) => onFilterChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="">All Categories</SelectItem>
            {availableCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.subcategory} 
          onValueChange={(value) => onFilterChange('subcategory', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Subcategory" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="">All Subcategories</SelectItem>
            {availableSubcategories.map(subcategory => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.priority} 
          onValueChange={(value) => onFilterChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="">All Priorities</SelectItem>
            {priorityOptions.map(priority => (
              <SelectItem key={priority} value={priority}>{priority}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default BasicFilters;
