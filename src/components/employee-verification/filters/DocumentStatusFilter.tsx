import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const DocumentStatusFilter: React.FC<DocumentStatusFilterProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Documents" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Documents</SelectItem>
        <SelectItem value="verified">Verified</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
        <SelectItem value="no-documents">No Documents</SelectItem>
        <SelectItem value="mixed">Mixed Status</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default DocumentStatusFilter;