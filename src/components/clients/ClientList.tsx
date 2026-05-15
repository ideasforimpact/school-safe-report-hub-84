
import React from 'react';
import { Client } from '@/contexts/ClientContext';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import ClientTableHeader from './ClientTableHeader';
import ClientRow from './ClientRow';

interface ClientListProps {
  clients: Client[];
  onViewApiCalls: (client: Client) => void;
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  canEditClient?: boolean;
}

const ClientList = ({
  clients,
  onViewApiCalls,
  onEditClick,
  onDeleteClient,
  canEditClient = true,
}: ClientListProps) => {
  return (
    <Table>
      <ClientTableHeader />
      <TableBody>
        {clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-4">
              No clients found. Add a client to get started.
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => (
            <ClientRow 
              key={client.id}
              client={client}
              onViewApiCalls={onViewApiCalls}
              onEditClick={onEditClick}
              onDeleteClient={onDeleteClient}
              canEdit={canEditClient}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ClientList;
