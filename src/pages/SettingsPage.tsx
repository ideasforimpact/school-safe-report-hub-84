
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users, GraduationCap, Building, ClipboardCheck, FileText } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import IncidentConfigurationContent from '@/components/configuration/IncidentConfigurationContent';
import UserManagement from '@/pages/UserManagement';
import StudentManagement from '@/pages/StudentManagement';
import { EducationalStructureConfig } from '@/pages/configuration/EducationalStructureConfig';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';
import AssessmentConfigurationContent from '@/components/configuration/AssessmentConfigurationContent';
import FormConfigurationContent from '@/components/configuration/FormConfigurationContent';
import { useEmployeeData } from '@/hooks/useEmployeeData';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { employeeData } = useEmployeeData();
  const [clientType, setClientType] = useState<string | null>(null);
  
  const { activeTab, setActiveTab, loading, campuses, classes, sections, facilities, 
          handleAddCampus, handleUpdateCampus, handleDeleteCampus,
          handleAddClass, handleUpdateClass, handleDeleteClass,
          handleAddSection, handleUpdateSection, handleDeleteSection,
          handleAddFacility, handleUpdateFacility, handleDeleteFacility } = useEducationalConfigurationManagement();

  // Check for tab parameter in URL and set active tab accordingly
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'form') {
      // Don't change activeTab since that's for educational configuration
      // The Tabs component will handle the form tab activation
    }
  }, [searchParams]);

  // Determine client type from employeeData or user data
  useEffect(() => {
    console.log('SettingsPage - employeeData:', employeeData);
    console.log('SettingsPage - user:', user);
    
    let detectedClientType = null;
    
    // First check employeeData
    if (employeeData?.clientType?.key) {
      detectedClientType = employeeData.clientType.key;
    } else if (employeeData?.client?.client_type?.key) {
      detectedClientType = employeeData.client.client_type.key;
    } 
    // Fallback to user data if employeeData doesn't have clientType
    else if (user?.clientType?.key) {
      detectedClientType = user.clientType.key;
    } else if (user?.client?.client_type?.key) {
      detectedClientType = user.client.client_type.key;
    }
    
    console.log('SettingsPage - Detected client type:', detectedClientType);
    setClientType(detectedClientType);
  }, [employeeData, user]);

  const defaultTab = searchParams.get('tab') === 'form' ? 'form' : 'incident';

  // Determine if educational tabs should be shown (for schools and similar educational institutions)
  const showEducationalTabs = clientType === 'school' || clientType === 'college' || clientType === 'university' || clientType === 'educational';

  console.log('SettingsPage - showEducationalTabs:', showEducationalTabs, 'clientType:', clientType);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure system settings</p>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="incident" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Incident Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="assessment" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span>Assessment Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Form Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            {showEducationalTabs && (
              <>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Student Management</span>
                </TabsTrigger>
                <TabsTrigger value="educational" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>Educational Structure</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="incident">
            <Card>
              <CardHeader>
                <CardTitle>Incident Configuration</CardTitle>
                <CardDescription>Configure incident categories, priorities, and other settings</CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentConfigurationContent />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assessment">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Configuration</CardTitle>
                <CardDescription>Create and manage assessment templates with yes/no questions</CardDescription>
              </CardHeader>
              <CardContent>
                <AssessmentConfigurationContent embedded={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Form Configuration</CardTitle>
                <CardDescription>Create and manage custom forms with a simple form builder</CardDescription>
              </CardHeader>
              <CardContent>
                <FormConfigurationContent />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="user" className="p-0">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their permissions in your institution</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement embedded={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {showEducationalTabs && (
            <>
              <TabsContent value="student" className="p-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Manage students in your institution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StudentManagement embedded={true} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="educational" className="p-0 bg-white rounded-md">
                <Card>
                  <CardHeader>
                    <CardTitle>Educational Structure Configuration</CardTitle>
                    <CardDescription>Manage campuses, classes, sections, and facilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EducationalStructureConfig 
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      loading={loading}
                      campuses={campuses}
                      addCampus={handleAddCampus}
                      updateCampus={handleUpdateCampus}
                      deleteCampus={handleDeleteCampus}
                      classes={classes}
                      addClass={handleAddClass}
                      updateClass={handleUpdateClass}
                      deleteClass={handleDeleteClass}
                      sections={sections}
                      addSection={handleAddSection}
                      updateSection={handleUpdateSection}
                      deleteSection={handleDeleteSection}
                      facilities={facilities}
                      addFacility={handleAddFacility}
                      updateFacility={handleUpdateFacility}
                      deleteFacility={handleDeleteFacility}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
