
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ClientHeaderProps {
  onAddClick: () => void;
  canCreateClient?: boolean;
}

const ClientHeader = ({ onAddClick, canCreateClient = true }: ClientHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Client Management</h1>
      {canCreateClient && (
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      )}
    </div>
  );
};

export default ClientHeader;
