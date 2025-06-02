
import React from 'react';
import { Client } from '@/contexts/ClientContext';
import { TableRow, TableCell } from '@/components/ui/table';
import ClientLogoCell from './ClientLogoCell';
import ClientStatusBadge from './ClientStatusBadge';
import ClientActionButtons from './ClientActionButtons';

interface ClientRowProps {
  client: Client;
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const ClientRow = ({ client, onEditClick, onDeleteClient }: ClientRowProps) => {
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
        <span className="text-sm text-gray-600">
          {client.superAdminEmail || 'Not set'}
        </span>
      </TableCell>
      <TableCell>
        <ClientActionButtons 
          client={client} 
          onEditClick={onEditClick} 
          onDeleteClient={onDeleteClient} 
        />
      </TableCell>
    </TableRow>
  );
};

export default ClientRow;
