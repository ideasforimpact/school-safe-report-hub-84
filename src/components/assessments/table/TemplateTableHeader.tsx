
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

interface TemplateTableHeaderProps {
  sortField: 'name' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt') => void;
}

const TemplateTableHeader = ({ sortField, sortDirection, onSort }: TemplateTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[280px] cursor-pointer" onClick={() => onSort('name')}>
          <div className="flex items-center">
            Template Name
            {sortField === 'name' && (
              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
            )}
          </div>
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Completion</TableHead>
        <TableHead>Questions</TableHead>
        <TableHead>Assigned To</TableHead>
        <TableHead>Due Date</TableHead>
        <TableHead className="cursor-pointer" onClick={() => onSort('createdAt')}>
          <div className="flex items-center">
            Created
            {sortField === 'createdAt' && (
              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
            )}
          </div>
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TemplateTableHeader;
