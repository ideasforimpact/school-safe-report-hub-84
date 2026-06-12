
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';

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
    <div className="space-y-4">
      {/* Search Bar - Full Width */}
      <div className="w-full">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
        <DebouncedSearchInput
          value={filters.search || ''}
          onChange={(val) => onFilterChange('search', val)}
          placeholder="Search tickets..."
          triggerOnEnter
        />
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <Select 
            value={filters.location || 'all'} 
            onValueChange={(value) => onFilterChange('location', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Locations" />
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
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <Select 
            value={filters.category || 'all'} 
            onValueChange={(value) => onFilterChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Categories" />
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
        </div>

        {/* Subcategory */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Subcategory</label>
          <Select 
            value={filters.subcategory || 'all'} 
            onValueChange={(value) => onFilterChange('subcategory', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Subcategories" />
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
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <Select 
            value={filters.priority || 'all'} 
            onValueChange={(value) => onFilterChange('priority', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Priorities" />
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
      </div>
    </div>
  );
};

export default BasicFilters;
