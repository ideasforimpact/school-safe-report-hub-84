
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ClientHeaderProps {
  onAddClick: () => void;
}

const ClientHeader = ({ onAddClick }: ClientHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Client Management</h1>
      <Button onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Client
      </Button>
    </div>
  );
};

export default ClientHeader;
