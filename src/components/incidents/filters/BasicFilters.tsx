
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterState } from '@/types/filterTypes';

interface BasicFiltersProps {
  filters: FilterState;
  onFilterChange: (field: string, value: any) => void;
  availableCategories: string[];
  availableSubcategories: string[];
  availableLocations: string[];
  statusOptions: string[];
  priorityOptions: string[];
}

const BasicFilters: React.FC<BasicFiltersProps> = ({
  filters,
  onFilterChange,
  availableCategories,
  availableSubcategories,
  availableLocations,
  statusOptions,
  priorityOptions
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search tickets..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Location */}
      <Select value={filters.location || ''} onValueChange={(value) => onFilterChange('location', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Locations</SelectItem>
          {availableLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status - Show all statuses including Closed */}
      <Select value={filters.status || ''} onValueChange={(value) => onFilterChange('status', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select value={filters.category || ''} onValueChange={(value) => onFilterChange('category', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {availableCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Subcategory */}
      <Select value={filters.subcategory || ''} onValueChange={(value) => onFilterChange('subcategory', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Subcategory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Subcategories</SelectItem>
          {availableSubcategories.map((subcategory) => (
            <SelectItem key={subcategory} value={subcategory}>
              {subcategory}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select value={filters.priority || ''} onValueChange={(value) => onFilterChange('priority', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          {priorityOptions.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BasicFilters;
