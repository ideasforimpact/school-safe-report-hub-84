import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface DocumentType {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const EmployeeDocumentTypeFilter: React.FC<Props> = ({ value, onChange }) => {
  const [types, setTypes] = useState<DocumentType[]>([]);

  useEffect(() => {
    const loadTypes = async () => {
      const { data } = await supabase
        .from('employee_document_type')
        .select('id, name')
        .order('name');

      setTypes(data || []);
    };

    loadTypes();
  }, []);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All Documents" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">All Documents</SelectItem>

        {types.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name.replace('_', ' ').toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmployeeDocumentTypeFilter;
