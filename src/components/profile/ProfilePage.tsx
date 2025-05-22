
import { useEffect, useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import EmployeeDetailsTab from './EmployeeDetailsTab';
import ModuleAccessTab from './ModuleAccessTab';
import { toast } from 'sonner';

interface ProfileData {
  employee: {
    id: string;
    client_id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    employee_type?: string;
    is_super_admin: boolean;
    client_name: string;
  };
  modules: {
    id: string;
    name: string;
    level: string;
    icon: string;
    access_level: Record<string, any>;
  }[];
}

const ProfilePage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!employeeData?.id || !employeeData?.clientId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('profile_info', {
          body: {
            employeeId: employeeData.id,
            clientId: employeeData.clientId
          }
        });
        
        if (error || !data?.success) {
          console.error('Error fetching profile data:', error || data?.message);
          toast.error('Failed to load profile information');
          setLoading(false);
          return;
        }
        
        setProfileData(data.data);
      } catch (error) {
        console.error('Error in profile data fetch:', error);
        toast.error('An error occurred while loading your profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [employeeData]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading profile information...</span>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No profile information available. Please ensure you are logged in with a valid account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="modules">Module Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <EmployeeDetailsTab employee={profileData.employee} />
        </TabsContent>
        
        <TabsContent value="modules">
          <ModuleAccessTab modules={profileData.modules} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
