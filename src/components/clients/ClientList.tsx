
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
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const ClientList = ({ clients, onEditClick, onDeleteClient }: ClientListProps) => {
  return (
    <Table>
      <ClientTableHeader />
      <TableBody>
        {clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-4">
              No clients found. Add a client to get started.
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => (
            <ClientRow 
              key={client.id}
              client={client}
              onEditClick={onEditClick}
              onDeleteClient={onDeleteClient}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ClientList;
