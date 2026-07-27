import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, FileText } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { ResourceCategory } from '@/types/eduSafeTypes';
import CategoryFilter from '@/components/edusafe/CategoryFilter';
import ResourceList from '@/components/edusafe/ResourceList';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TablePaginationBar from '@/components/common/TablePaginationBar';

const EduSafeResourcesContent = () => {
  const { resources, refreshResources, totalCount } = useEduSafe();
  const { user, employeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'saas' | 'organisational'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Check if user has super admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  // Check if user has edu resources admin access
  const hasEduResourcesAdmin = useMemo(() => {
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
    if (employeeData?.clientType?.key) {
      return employeeData.clientType.key;
    }
    if (user?.clientType?.key) {
      return user.clientType.key;
    }
    if (user?.client?.client_type?.key) {
      return user.client.client_type.key;
    }
    return null;
  };
  
  const clientTypeKey = getClientTypeKey();
  const isSchoolClient = clientTypeKey === 'school';

  const activeFilters = useMemo(() => ({
    category: selectedCategory,
    ownerType: selectedTab,
  }), [selectedCategory, selectedTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refreshResources(searchTerm, page, PAGE_SIZE, activeFilters);
  };

  // Fetch from edge function whenever search, tab, or category changes.
  // Defaults (all/all, empty search) preserve the previous unfiltered listing behaviour.
  useEffect(() => {
    setCurrentPage(1);
    refreshResources(searchTerm, 1, PAGE_SIZE, activeFilters);
  }, [searchTerm, activeFilters, refreshResources]);

  const displayTotalCount = totalCount;
  const totalPages = Math.ceil(displayTotalCount / PAGE_SIZE) || 1;

  // Ensure currentPage stays within valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [displayTotalCount, totalPages, currentPage]);

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
            <DebouncedSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search resources..."
              triggerOnEnter
            />
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
        <ResourceList resources={resources} />
        <TablePaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={displayTotalCount}
          pageSize={PAGE_SIZE}
          itemLabel="resources"
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

const EduSafeResourcesPage = () => {
  return (
    <Layout>
      {/* skipInitialFetch: page drives the first fetch with current filters to avoid a double request */}
      <EduSafeProvider skipInitialFetch>
        <EduSafeResourcesContent />
      </EduSafeProvider>
    </Layout>
  );
};

export default EduSafeResourcesPage;
