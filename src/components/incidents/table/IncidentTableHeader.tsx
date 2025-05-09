
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';
export type SortField = 'ticketId' | 'date' | 'category' | 'priority' | 'facility' | 'status';

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
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 text-blue-600" /> 
      : <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />;
  };

  const createSortableHeader = (label: string, field: SortField) => (
    <div
      className="flex items-center cursor-pointer hover:text-blue-700 transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {getSortIcon(field)}
    </div>
  );

  return (
    <TableHeader>
      <TableRow>
        <TableHead>{createSortableHeader('Ticket', 'ticketId')}</TableHead>
        <TableHead>{createSortableHeader('Date', 'date')}</TableHead>
        <TableHead>{createSortableHeader('Category', 'category')}</TableHead>
        <TableHead>{createSortableHeader('Priority', 'priority')}</TableHead>
        <TableHead>{createSortableHeader('Facility', 'facility')}</TableHead>
        <TableHead>{createSortableHeader('Status', 'status')}</TableHead>
        <TableHead>Owner</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
