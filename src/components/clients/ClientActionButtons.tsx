
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Client } from '@/contexts/ClientContext';

interface ClientActionButtonsProps {
  client: Client;
  onViewApiCalls: (client: Client) => void;
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const ClientActionButtons = ({ 
  client, 
  onViewApiCalls,
  onEditClick, 
  onDeleteClient 
}: ClientActionButtonsProps) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewApiCalls(client)}
        title="View API calls"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onEditClick(client)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      {/* Delete button commented out for backoffice clients */}
      {/* <Button 
        variant="ghost" 
        size="icon"
        onClick={() => onDeleteClient(client.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button> */}
    </div>
  );
};

export default ClientActionButtons;
