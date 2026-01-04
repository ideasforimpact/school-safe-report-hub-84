import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plug, Eye, Link as LinkIcon, Loader2 } from 'lucide-react';
import { fetchClientNames } from '@/services/client/clientService';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
}

interface IntegrationClient {
  id: string;
  name: string;
  linkedClientName: string | null;
  linkedStatus: boolean;
}

const IntegrationPage = () => {
  const [clients, setClients] = useState<IntegrationClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientNames = await fetchClientNames();
      
      // Map client names to IntegrationClient format
      const integrationClients: IntegrationClient[] = clientNames.map(client => ({
        id: client.id,
        name: client.name,
        linkedClientName: null, // As of now, show "-"
        linkedStatus: false, // As of now, false
      }));

      setClients(integrationClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (clientId: string) => {
    console.log('View client:', clientId);
    // TODO: Implement view functionality
  };

  const handleLink = (clientId: string) => {
    console.log('Link client:', clientId);
    // TODO: Implement link functionality
  };

  return (
    <Layout>
      <div className="space-y-8 p-[50px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Plug className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Integration</h1>
              <p className="text-gray-500 mt-1">Manage client integrations and connections</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Integrations</CardTitle>
                <CardDescription>
                  View and manage client integration connections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="mt-4 text-gray-500">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Plug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Clients Found
                </h3>
                <p className="text-gray-500">
                  No clients are currently available in the system
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Linked Client Name</TableHead>
                    <TableHead>Linked Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.linkedClientName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={client.linkedStatus ? "default" : "secondary"}>
                          {client.linkedStatus ? 'Linked' : 'Not Linked'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(client.id)}
                            title="View client"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLink(client.id)}
                            title="Link client"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default IntegrationPage;

