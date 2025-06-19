
import React from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import MetricsCards from '@/components/backoffice/MetricsCards';
import ClientsTable from '@/components/backoffice/ClientsTable';
import { useClient } from '@/contexts/ClientContext';
import { useState } from 'react';
import ClientDialog from '@/components/backoffice/ClientDialog';
import AuthDebugger from '@/components/debug/AuthDebugger';

const BackofficeDashboard = () => {
  const { clients, filteredClients, searchTerm, setSearchTerm } = useClient();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const handleAddClient = () => {
    setIsClientDialogOpen(true);
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the SaaS platform backoffice. Monitor and manage your clients.
          </p>
        </div>

        {/* Temporary Debug Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🐛 Debug Mode</h2>
          <p className="text-yellow-700 text-sm mb-4">
            This debug section will help us identify the authentication issue. Please check the results below.
          </p>
          <AuthDebugger />
        </div>

        <MetricsCards />
        
        <ClientsTable 
          clients={clients}
          filteredClients={filteredClients}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddClient={handleAddClient}
        />

        <ClientDialog 
          isOpen={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
        />
      </div>
    </BackofficeLayout>
  );
};

export default BackofficeDashboard;
