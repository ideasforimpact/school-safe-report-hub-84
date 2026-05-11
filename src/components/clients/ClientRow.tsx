
import React from 'react';
import { Client } from '@/contexts/ClientContext';
import { TableRow, TableCell } from '@/components/ui/table';
import ClientLogoCell from './ClientLogoCell';
import ClientStatusBadge from './ClientStatusBadge';
import ClientActionButtons from './ClientActionButtons';

interface ClientRowProps {
  client: Client;
  onViewApiCalls: (client: Client) => void;
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  canEdit?: boolean;
}

const ClientRow = ({
  client,
  onViewApiCalls,
  onEditClick,
  onDeleteClient,
  canEdit = true,
}: ClientRowProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TableRow>
      <TableCell>
        <ClientLogoCell name={client.name} logo={client.logo} />
      </TableCell>
      <TableCell className="font-medium">{client.name}</TableCell>
      <TableCell>{client.institutionType || 'Other'}</TableCell>
      <TableCell>{client.contactPerson}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
      <TableCell>{formatDate(client.creationDate)}</TableCell>
      <TableCell>
        <ClientStatusBadge active={client.active} />
      </TableCell>
      <TableCell>
        <ClientActionButtons 
          client={client} 
          onViewApiCalls={onViewApiCalls}
          onEditClick={onEditClick} 
          onDeleteClient={onDeleteClient}
          canEdit={canEdit}
        />
      </TableCell>
    </TableRow>
  );
};

export default ClientRow;
