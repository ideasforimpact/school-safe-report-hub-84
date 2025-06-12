
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServerFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  priority?: string;
  location?: string;
  facility?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface BasicFiltersProps {
  filters: ServerFilters;
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
      <Select 
        value={filters.location || 'all'} 
        onValueChange={(value) => onFilterChange('location', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Locations</SelectItem>
          {availableLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select 
        value={filters.status || 'all'} 
        onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select 
        value={filters.category || 'all'} 
        onValueChange={(value) => onFilterChange('category', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Categories</SelectItem>
          {availableCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Subcategory */}
      <Select 
        value={filters.subcategory || 'all'} 
        onValueChange={(value) => onFilterChange('subcategory', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Subcategory" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Subcategories</SelectItem>
          {availableSubcategories.map((subcategory) => (
            <SelectItem key={subcategory} value={subcategory}>
              {subcategory}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select 
        value={filters.priority || 'all'} 
        onValueChange={(value) => onFilterChange('priority', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          <SelectItem value="all">All Priorities</SelectItem>
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
