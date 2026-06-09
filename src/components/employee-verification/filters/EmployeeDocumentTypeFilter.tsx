import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useEmployeeVerification } from '@/contexts/employee-verification';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const EmployeeDocumentTypeFilter: React.FC<Props> = ({ value, onChange }) => {
  const { documentTypes } = useEmployeeVerification();

  const orderedTypes = React.useMemo(() => {
    const result = [...documentTypes];
    const otherIdx = result.findIndex(t => t.name === 'other_documents');
    if (otherIdx > -1) {
      const [other] = result.splice(otherIdx, 1);
      result.push(other);
    }
    return result;
  }, [documentTypes]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All Documents" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">All Documents</SelectItem>

        {orderedTypes.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name.replace('_', ' ').toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmployeeDocumentTypeFilter;
