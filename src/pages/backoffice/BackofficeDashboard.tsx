
import { useState, useEffect } from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { useClient } from '@/contexts/ClientContext';
import MetricsCards from '@/components/backoffice/MetricsCards';
import ClientsTable from '@/components/backoffice/ClientsTable';
import ClientDialog from '@/components/backoffice/ClientDialog';

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
    active: true,
    logo: '',
    allowedDomains: [],
    authProviders: {
      google: false,
      microsoft: false,
      zoho: false
    }
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
      active: true,
      logo: '',
      allowedDomains: [],
      authProviders: {
        google: false,
        microsoft: false,
        zoho: false
      }
    });
  };

  const handleAddClient = () => {
    addClient(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };
  
  const handleCancelAdd = () => {
    setIsAddDialogOpen(false);
    resetForm();
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
        <MetricsCards 
          totalClients={metrics.totalClients}
          activeClients={metrics.activeClients}
          totalIncidents={metrics.totalIncidents}
          recentLogins={metrics.recentLogins}
        />
        
        {/* Clients Table */}
        <ClientsTable 
          clients={clients}
          filteredClients={filteredClients}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddClient={() => setIsAddDialogOpen(true)}
        />
      </div>
      
      {/* Add Client Dialog - Using the new ClientDialog component */}
      <ClientDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddClient}
        onCancel={handleCancelAdd}
        isEdit={false}
      />
    </BackofficeLayout>
  );
};

export default BackofficeDashboard;
