
import { useState, useEffect } from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { useClient } from '@/contexts/ClientContext';
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
import { Plus, Search, ArrowUpRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const BackofficeDashboard = () => {
  const { clients, addClient } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
  
  // Sample metrics data (in a real app, this would come from an API)
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    totalIncidents: 125,
    recentLogins: 18
  });
  
  useEffect(() => {
    // Update metrics based on clients
    setMetrics(prev => ({
      ...prev,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.active).length
    }));
  }, [clients]);
  
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
  };

  const handleAddClient = () => {
    addClient(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };
  
  const handleModuleAccessChange = (module: keyof typeof formData.moduleAccess, value: boolean) => {
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
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BackofficeLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Backoffice Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all client operations</p>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.activeClients} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalIncidents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all clients
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.recentLogins}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In the last 24 hours
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">Operational</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All systems running normally
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Clients Table */}
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
                <Button onClick={() => setIsAddDialogOpen(true)}>
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
      </div>
      
      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Quickly onboard a new client to the platform
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
    </BackofficeLayout>
  );
};

export default BackofficeDashboard;
