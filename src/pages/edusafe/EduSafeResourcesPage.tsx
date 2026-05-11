
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, FileText, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { ResourceCategory, EduSafeResource } from '@/types/eduSafeTypes';
import CategoryFilter from '@/components/edusafe/CategoryFilter';
import ResourceList from '@/components/edusafe/ResourceList';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';

const EduSafeResourcesContent = () => {
  const { resources, getMyResources, getSaasResources } = useEduSafe();
  const { user, employeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'saas' | 'organisational'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user has super admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  // Check if user has edu resources admin access
  const hasEduResourcesAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    const eduResourcesModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'edu resources' || 
                module.name.toLowerCase() === 'edusafe' ||
                module.name.toLowerCase() === 'edusafe resources'
    );
    
    return eduResourcesModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, employeeState.configuredModules]);
  
  // Check client type from employeeData first, then from user
  const getClientTypeKey = () => {
    // First check employeeData
    if (employeeData?.clientType?.key) {
      return employeeData.clientType.key;
    }
    
    // Then check user.clientType
    if (user?.clientType?.key) {
      return user.clientType.key;
    }
    
    // Then check user.client.client_type.key
    if (user?.client?.client_type?.key) {
      return user.client.client_type.key;
    }
    
    return null;
  };
  
  // Get organization name dynamically
  const getOrganizationName = () => {
    // First check employeeData
    if (employeeData?.clientType?.name) {
      return employeeData.clientType.name;
    }
    
    // Then check user.clientType
    if (user?.clientType?.name) {
      return user.clientType.name;
    }
    
    // Then check user.client.client_type.name
    if (user?.client?.client_type?.name) {
      return user.client.client_type.name;
    }
    
    return 'Organisation';
  };
  
  const clientTypeKey = getClientTypeKey();
  const organizationName = getOrganizationName();
  const isSchoolClient = clientTypeKey === 'school';
  
  // Filter resources based on selected tab, category and search term
  const filteredResources = resources.filter(resource => {
    // First filter by tab
    if (selectedTab === 'saas' && resource.ownerType !== 'saas') {
      return false;
    }
    
    if (selectedTab === 'organisational') {
      // For admin, show only their organisation resources
      if (user?.role !== 'saas_owner' && resource.ownerType === 'school') {
        if (user?.clientId !== resource.clientId) {
          return false;
        }
      } else if (resource.ownerType !== 'school') {
        return false;
      }
    }
    
    // Then filter by category
    if (selectedCategory !== 'all' && resource.category !== selectedCategory) {
      return false;
    }
    
    // Then filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  

  
  return (
    <div className="w-full py-6">
      <div className="mx-6 mb-8 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-xl ">
              <FileText className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold leading-tight">
                EduSafe Resources
              </h1>
              <p className="text-sm text-gray-600">
                Browse and download safety resources
              </p>
            </div>
          </div>
          {hasEduResourcesAdmin && !isReadOnlySwitchedContext && (
            <Button asChild className="self-start md:self-center">
              <Link to="/edusafe/upload">
                <FilePlus className="mr-2 h-4 w-4" />
                Upload Resource
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="mb-6 mx-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search resources..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Only show tabs if client type is "school" */}
          {isSchoolClient && (
            <Tabs 
              value={selectedTab} 
              onValueChange={(value) => setSelectedTab(value as 'all' | 'saas' | 'organisational')}
              className="w-full md:w-1/2"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All Resources</TabsTrigger>
                <TabsTrigger value="saas">Global Resources</TabsTrigger>
                <TabsTrigger value="organisational">Organisational Resources</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
        
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
      
      <Card className="p-6 mb-8 mx-6">
        <ResourceList 
          resources={filteredResources}
        />
      </Card>
    </div>
  );
};

const EduSafeResourcesPage = () => {
  return (
    <Layout>
      <EduSafeProvider>
        <EduSafeResourcesContent />
      </EduSafeProvider>
    </Layout>
  );
};

export default EduSafeResourcesPage;
