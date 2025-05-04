
import React from 'react';
import { Client } from '@/contexts/ClientContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onEditClick: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const ClientList = ({ clients, onEditClick, onDeleteClient }: ClientListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Logo</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Module Access</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-4">
              No clients found. Add a client to get started.
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                {client.logo ? (
                  <div className="h-10 w-10 overflow-hidden rounded">
                    <img 
                      src={client.logo} 
                      alt={`${client.name} logo`} 
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.contactPerson}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{formatDate(client.creationDate)}</TableCell>
              <TableCell>
                <Badge variant={client.active ? "secondary" : "destructive"} className={client.active ? "bg-green-100 text-green-800" : ""}>
                  {client.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {client.moduleAccess?.incidentReporting && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">Reporting</Badge>
                  )}
                  {client.moduleAccess?.allIncidents && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">All Incidents</Badge>
                  )}
                  {client.moduleAccess?.insights && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">Insights</Badge>
                  )}
                  {client.moduleAccess?.benchmarking && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">Benchmarking</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditClick(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDeleteClient(client.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ClientList;
