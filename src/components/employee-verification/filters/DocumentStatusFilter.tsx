import React from 'react';
import MultiSelectFilter from '@/components/common/MultiSelectFilter';

interface DocumentStatusFilterProps {
  value: string[];          // selected statuses; empty = all
  onChange: (value: string[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'no-documents', label: 'No Documents' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const DocumentStatusFilter: React.FC<DocumentStatusFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <MultiSelectFilter
      options={STATUS_OPTIONS}
      selected={value}
      onChange={onChange}
      placeholder="All Status"
    />
  );
};

export default DocumentStatusFilter;
