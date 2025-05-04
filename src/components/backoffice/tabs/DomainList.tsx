
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

interface DomainListProps {
  domains: string[];
  onRemove: (domain: string) => void;
}

const DomainList = ({ domains, onRemove }: DomainListProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {domains.map((domain) => (
        <Badge key={domain} variant="secondary" className="flex items-center gap-1">
          {domain}
          <button 
            onClick={() => onRemove(domain)} 
            className="ml-1 hover:text-destructive focus:outline-none"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {domain}</span>
          </button>
        </Badge>
      ))}
      {domains.length === 0 && (
        <p className="text-sm text-gray-500 italic">No domains added yet</p>
      )}
    </div>
  );
};

export default DomainList;
