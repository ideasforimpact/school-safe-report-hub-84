
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import DomainList from './DomainList';

interface DomainInputProps {
  domains: string[];
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
}

const DomainInput = ({ domains, onAdd, onRemove }: DomainInputProps) => {
  const [newDomain, setNewDomain] = useState('');
  
  const handleAdd = () => {
    if (newDomain && !domains.includes(newDomain)) {
      onAdd(newDomain);
      setNewDomain('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Allowed Email Domains <span className="text-red-500">*</span></label>
      <p className="text-sm text-gray-500">
        Only users with email addresses from these domains can access this client's portal
      </p>
      
      <div className="flex gap-2 mb-2">
        <Input 
          placeholder="e.g. example.com" 
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button type="button" onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <DomainList domains={domains} onRemove={onRemove} />
    </div>
  );
};

export default DomainInput;
