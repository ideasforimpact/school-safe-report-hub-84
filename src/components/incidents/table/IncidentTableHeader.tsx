
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type SortField = 'ticketId' | 'date' | 'category' | 'priority' | 'location' | 'facility' | 'status';
export type SortDirection = 'asc' | 'desc';

interface IncidentTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const IncidentTableHeader: React.FC<IncidentTableHeaderProps> = ({ 
  sortField, 
  sortDirection, 
  onSort 
}) => {
  // Helper to render column header with sort indicators
  const getSortableHeader = (field: SortField, label: string) => {
    return (
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <div className="ml-1 flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
          <ChevronDown 
            className={`h-3 w-3 mt-[-3px] ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead>{getSortableHeader('ticketId', 'ID')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('date', 'Date')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('category', 'Category')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('priority', 'Priority')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('location', 'Location')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('facility', 'Facility')}</TableHead>
        <TableHead className="text-left">{getSortableHeader('status', 'Status')}</TableHead>
        <TableHead className="text-left">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
