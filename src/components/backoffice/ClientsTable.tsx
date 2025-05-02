
import React from 'react';
import { Client } from '@/contexts/ClientContext';
import { Search, ArrowUpRight, Plus } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientsTableProps {
  clients: Client[];
  filteredClients: Client[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onAddClient: () => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ 
  clients, 
  filteredClients, 
  searchTerm, 
  setSearchTerm,
  onAddClient
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Client Overview</CardTitle>
            <CardDescription>Manage client accounts and access</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search clients..."
                className="pl-8 w-full sm:w-[240px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={onAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Module Access</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No clients found. Add a new client to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>
                    <Badge variant={client.active ? "secondary" : "destructive"} className={client.active ? "bg-green-100 text-green-800" : ""}>
                      {client.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(client.creationDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.moduleAccess?.incidentReporting && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Reporting</Badge>
                      )}
                      {client.moduleAccess?.insights && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">Insights</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-sm text-gray-500">
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      </CardFooter>
    </Card>
  );
};

export default ClientsTable;
