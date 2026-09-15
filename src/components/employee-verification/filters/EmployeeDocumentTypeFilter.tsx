import React from 'react';
import MultiSelectFilter from '@/components/common/MultiSelectFilter';
import { useEmployeeVerification } from '@/contexts/employee-verification';

interface Props {
  value: string[];          // selected document type ids; empty = all
  onChange: (value: string[]) => void;
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

  const options = orderedTypes.map((type) => ({
    value: type.id,
    label: type.name.replace('_', ' ').toUpperCase(),
  }));

  return (
    <MultiSelectFilter
      options={options}
      selected={value}
      onChange={onChange}
      placeholder="All Documents"
      className="w-[220px]"
    />
  );
};

export default EmployeeDocumentTypeFilter;
