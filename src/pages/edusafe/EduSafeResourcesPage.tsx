
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, Search } from 'lucide-react';
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

const EduSafeResourcesContent = () => {
  const { resources, getMyResources, getSaasResources } = useEduSafe();
  const { user, employeeData } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'saas' | 'organisational'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 mx-6">
        <div>
          <h1 className="text-3xl font-bold text-left">EduSafe Resources</h1>
          <p className="text-gray-500 mt-1 text-left">Browse and download safety resources</p>
        </div>
        
        <Button asChild>
          <Link to="/edusafe/upload">
            <FilePlus className="h-4 w-4 mr-2" />
            Upload Resource
          </Link>
        </Button>
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
