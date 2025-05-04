import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useClient, Client } from '@/contexts/ClientContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ClientFormDialog from '@/components/backoffice/ClientFormDialog';

const ClientManagement = () => {
  const { isAdmin } = useAuth();
  const { clients, addClient, updateClient, deleteClient } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    moduleAccess: {
      incidentReporting: true,
      allIncidents: true,
      insights: true,
      benchmarking: false
    },
    active: true,
    logo: '',
    allowedDomains: [] as string[],
    authProviders: {
      google: false,
      microsoft: false,
      zoho: false
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contactPerson: '',
      phone: '',
      moduleAccess: {
        incidentReporting: true,
        allIncidents: true,
        insights: true,
        benchmarking: false
      },
      active: true,
      logo: '',
      allowedDomains: [],
      authProviders: {
        google: false,
        microsoft: false,
        zoho: false
      }
    });
    setCurrentClient(null);
  };

  const handleAddClient = () => {
    addClient(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (client: Client) => {
    setCurrentClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      contactPerson: client.contactPerson,
      phone: client.phone,
      moduleAccess: {
        incidentReporting: client.moduleAccess?.incidentReporting ?? true,
        allIncidents: client.moduleAccess?.allIncidents ?? true,
        insights: client.moduleAccess?.insights ?? true,
        benchmarking: client.moduleAccess?.benchmarking ?? false
      },
      active: client.active,
      logo: client.logo || '',
      allowedDomains: client.allowedDomains || [],
      authProviders: {
        google: client.authProviders?.google ?? false,
        microsoft: client.authProviders?.microsoft ?? false,
        zoho: client.authProviders?.zoho ?? false
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = () => {
    if (currentClient) {
      updateClient(currentClient.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Client Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Manage your clients and their module access
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            onClick={() => handleEditClick(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClient(client.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Use the new ClientFormDialog component instead of inline dialogs */}
      <ClientFormDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddClient}
        onCancel={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        isEdit={false}
      />

      <ClientFormDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateClient}
        onCancel={() => {
          setIsEditDialogOpen(false);
          resetForm();
        }}
        isEdit={true}
      />
    </Layout>
  );
};

export default ClientManagement;
