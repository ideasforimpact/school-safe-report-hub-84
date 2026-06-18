
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getModuleAccessForUser } from '@/services/employee/employeeModuleService';
import Loader from '@/components/common/Loader';

interface ClientInfo {
  name: string;
  id: string;
}

interface ModuleInfo {
  name: string;
  key: string;
  access_level: {
    is_admin?: boolean;
    [key: string]: any;
  };
}

interface ProfileInfo {
  employeeDetails: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeType: string;
    department: string;
  };
  clientInfo: ClientInfo;
  moduleAccess: ModuleInfo[];
}

const ProfilePage: React.FC = () => {
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, employeeData } = useAuth();
  const { state } = useEmployeeStore();
  const employeeStoreData = getEmployeeData(state);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        if (!employeeData?.id) {
          toast.error("Employee information not available");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('profile_info', {
          body: {
            employee_id: employeeData.id,
            client_id: employeeData.clientId
          }
        });

        if (error) {
          console.error("Error fetching profile information:", error);
          toast.error("Failed to load profile information");
          setLoading(false);
          return;
        }

        if (data) {
          // Always fetch module access using the service function
          // This ensures normal employees get their module access correctly
          let moduleAccess: ModuleInfo[] = [];
          
          try {
            console.log("Fetching module access using service function for employee:", employeeData.id, {
              isSuperAdmin: employeeData.isSuperAdmin,
              clientId: employeeData.clientId
            });
            
            const moduleAccessItems = await getModuleAccessForUser({
              id: employeeData.id,
              isSuperAdmin: employeeData.isSuperAdmin || false,
              clientId: employeeData.clientId
            });
            
            // Convert ModuleAccessItem format to ModuleInfo format
            moduleAccess = moduleAccessItems.map(item => ({
              id: item.module_id || '',
              name: item.name,
              key: item.key || item.name.toLowerCase().replace(/\s+/g, '_'),
              access_level: item.level || {}
            }));
            
            console.log("Fetched module access items:", moduleAccess.length, "modules");
          } catch (moduleError) {
            console.error("Error fetching module access via service:", moduleError);
            // Fall back to edge function data if service call fails
            moduleAccess = data.moduleAccess || [];
          }
          
          setProfileInfo({
            ...data,
            moduleAccess
          });
        }
      } catch (error) {
        console.error("Error in profile information request:", error);
        toast.error("An error occurred while loading profile information");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileInfo();
  }, [employeeData]);

  const ProfileContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader text="Loading profile..." />
        </div>
      );
    }
    
    return (
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>
            Your account information and module access details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="employee-details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employee-details">Employee Details</TabsTrigger>
              <TabsTrigger value="module-access">Module Access</TabsTrigger>
            </TabsList>

            <TabsContent value="employee-details" className="mt-4">
              <EmployeeDetails 
                employee={profileInfo?.employeeDetails || {
                  id: employeeData?.id || '',
                  firstName: user?.firstName || employeeData?.firstName || '',
                  lastName: user?.lastName || employeeData?.lastName || '',
                  email: user?.email || employeeData?.email || '',
                  employeeType: employeeData?.employeeType || '',
                  department: employeeData?.department || ''
                }}
                client={profileInfo?.clientInfo || { 
                  name: 'Loading...', 
                  id: employeeData?.clientId || '' 
                }}
              />
            </TabsContent>

            <TabsContent value="module-access" className="mt-4">
              <ModuleAccess 
                modules={profileInfo?.moduleAccess || []}
                loading={!profileInfo}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <ProfileContent />
      </div>
    </Layout>
  );
};

interface EmployeeDetailsProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeType: string;
    department: string;
  };
  client: ClientInfo;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, client }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">First Name</label>
            <p className="mt-1 text-base">{employee.firstName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Last Name</label>
            <p className="mt-1 text-base">{employee.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-base">{employee.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Department</label>
            <p className="mt-1 text-base">{employee.department || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Employee Type</label>
            <p className="mt-1 text-base">{employee.employeeType || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Client</label>
            <p className="mt-1 text-base">{client.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModuleAccessProps {
  modules: ModuleInfo[];
  loading: boolean;
}

const ModuleAccess: React.FC<ModuleAccessProps> = ({ modules, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No module access information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Module Access Permissions</h3>
        <div className="mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modules.map((module, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{module.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <AccessLevelBadge accessLevel={module.access_level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AccessLevelBadge: React.FC<{ accessLevel: { is_admin?: boolean; [key: string]: any } | undefined }> = ({ accessLevel }) => {
  const isAdmin = accessLevel?.is_admin === true;
  
  if (!accessLevel || Object.keys(accessLevel).length === 0) {
    return <Badge variant="outline" className="text-gray-500 border-gray-300">Regular User</Badge>;
  }
  
  if (isAdmin) {
    return <Badge variant="success" className="bg-green-100 text-green-800 border-green-500 font-medium">Administrator</Badge>;
  }
  
  // Check if there are any other access level indicators
  const accessKeys = Object.keys(accessLevel).filter(key => key !== 'is_admin');
  if (accessKeys.length > 0) {
    return <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50">
      {accessKeys.map(key => `${key}: ${accessLevel[key]}`).join(', ')}
    </Badge>;
  }
  
  return <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">Regular User</Badge>;
};

const determineAccessLevel = (accessLevel: { is_admin?: boolean; [key: string]: any } | undefined): string => {
  if (!accessLevel || Object.keys(accessLevel).length === 0) {
    return "Regular User";
  }
  
  if (accessLevel.is_admin === true) {
    return "Administrator";
  } else if (accessLevel.is_admin === false) {
    return "Regular User";
  }
  
  // Check if there are any other access level indicators
  const accessKeys = Object.keys(accessLevel).filter(key => key !== 'is_admin');
  if (accessKeys.length > 0) {
    return accessKeys.map(key => `${key}: ${accessLevel[key]}`).join(', ');
  }
  
  return "Regular User";
};

export default ProfilePage;
