
import { useState, useEffect } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IncidentType } from '@/contexts/IncidentContext';

interface FilterState {
  type: string;
  category: string;
  subcategory: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  priority: string;
}

interface IncidentFiltersProps {
  filters: FilterState;
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  availableCategories: string[];
  availableSubcategories: string[];
}

const IncidentFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableCategories,
  availableSubcategories
}: IncidentFiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search incidents or ticket ID..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
          
          <Select 
            value={filters.type} 
            onValueChange={(value) => onFilterChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="Incident">Incident</SelectItem>
              <SelectItem value="Near Miss">Near Miss</SelectItem>
              <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.status} 
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select 
            value={filters.category} 
            onValueChange={(value) => onFilterChange('category', value)}
            disabled={availableCategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {availableCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.subcategory} 
            onValueChange={(value) => onFilterChange('subcategory', value)}
            disabled={availableSubcategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">From:</span>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">To:</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              className="w-auto"
            />
          </div>
          
          <Button variant="outline" onClick={onClearFilters} className="ml-auto">
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IncidentFilters;
