
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
    active: true
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
      active: true
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
      active: client.active
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

  const handleModuleAccessChange = (module: keyof Client['moduleAccess'], value: boolean) => {
    setFormData({
      ...formData,
      moduleAccess: {
        ...formData.moduleAccess,
        [module]: value
      }
    });
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
                    <TableCell colSpan={8} className="text-center py-4">
                      No clients found. Add a client to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
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

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name">Client Name</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contactPerson">Contact Person</label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone">Phone</label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Module Access</label>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incident-reporting"
                    checked={formData.moduleAccess.incidentReporting}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('incidentReporting', checked === true)
                    }
                  />
                  <label 
                    htmlFor="incident-reporting"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incident Reporting
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="all-incidents"
                    checked={formData.moduleAccess.allIncidents}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('allIncidents', checked === true)
                    }
                  />
                  <label 
                    htmlFor="all-incidents"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All Incidents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insights"
                    checked={formData.moduleAccess.insights}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('insights', checked === true)
                    }
                  />
                  <label 
                    htmlFor="insights"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insights
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="benchmarking"
                    checked={formData.moduleAccess.benchmarking}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('benchmarking', checked === true)
                    }
                  />
                  <label 
                    htmlFor="benchmarking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Benchmarking
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="active-status"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData({...formData, active: checked === true})
                }
              />
              <label 
                htmlFor="active-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active Client
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddClient}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name">Client Name</label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-contactPerson">Contact Person</label>
              <Input
                id="edit-contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-email">Email</label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-phone">Phone</label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Module Access</label>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-incident-reporting"
                    checked={formData.moduleAccess.incidentReporting}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('incidentReporting', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-incident-reporting"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incident Reporting
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-all-incidents"
                    checked={formData.moduleAccess.allIncidents}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('allIncidents', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-all-incidents"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All Incidents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-insights"
                    checked={formData.moduleAccess.insights}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('insights', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-insights"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insights
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-benchmarking"
                    checked={formData.moduleAccess.benchmarking}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('benchmarking', checked === true)
                    }
                  />
                  <label 
                    htmlFor="edit-benchmarking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Benchmarking
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="edit-active-status"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData({...formData, active: checked === true})
                }
              />
              <label 
                htmlFor="edit-active-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active Client
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClient}>Update Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ClientManagement;
