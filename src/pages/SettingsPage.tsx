
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users, GraduationCap, Building, ClipboardCheck, FileText, UsersRound, Settings } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import IncidentConfigurationContent from '@/components/configuration/IncidentConfigurationContent';
import UserManagement from '@/pages/UserManagement';
import StudentManagement from '@/pages/StudentManagement';
import { EducationalStructureTabContent } from '@/components/configuration/EducationalStructureTabContent';
import AssessmentConfigurationContent from '@/components/configuration/AssessmentConfigurationContent';
import FormConfigurationContent from '@/components/configuration/FormConfigurationContent';
import GroupConfigurationContent from '@/components/configuration/GroupConfigurationContent';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import { useLang } from '@/hooks/useLang';

const SETTINGS_TAB_VALUES = ['incident', 'assessment', 'form', 'user', 'group', 'student', 'educational'];

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const [clientType, setClientType] = useState<string | null>(null);

  // Mirrors the active tab into the `?tab=` URL param. AssessmentContext reads
  // this to only fetch assessment templates while this tab is actually open —
  // without it, `/settings` alone can't distinguish which tab is active, so
  // opening Incident Configuration (or any other tab) was also firing the
  // Assessment Configuration tab's template fetch.
  const initialTabParam = searchParams.get('tab');
  const [currentTab, setCurrentTab] = useState(
    SETTINGS_TAB_VALUES.includes(initialTabParam ?? '') ? (initialTabParam as string) : 'incident'
  );

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', value);
      return next;
    }, { replace: true });
  };

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

  const lang = useLang();

  // Show structure tabs for all client types
  const showEducationalTabs = clientType === 'school' || clientType === 'college' || clientType === 'university' || clientType === 'educational' || clientType === 'institute' || clientType === 'work';

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
            <div className="flex items-start gap-4">
              <Settings className="h-8 w-8 text-primary mt-1" />
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-600 mt-1">Configure system settings</p>
              </div>
            </div>
          </div>
          
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full pl-5 pr-[25px]">
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
              <TabsTrigger value="group" className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                <span>Group Configuration</span>
              </TabsTrigger>
              {showEducationalTabs && (
                <>
                  {clientType !== 'work' && (
                    <TabsTrigger
                      value="student"
                      className="flex items-center gap-2"
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Student Management</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="educational" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{lang.structure.pageTitle}</span>
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
              <Card className="w-full">
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
              <Card className="w-full">
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
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage users and their permissions in your institution</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement embedded={true} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="group" className="p-0">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Group Configuration</CardTitle>
                  <CardDescription>Manage groups and their members</CardDescription>
                </CardHeader>
                <CardContent>
                  <GroupConfigurationContent />
                </CardContent>
              </Card>
            </TabsContent>
            
            {showEducationalTabs && (
              <>
                {clientType !== 'work' && (
                  <TabsContent value="student" className="p-0">
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle>Student Management</CardTitle>
                        <CardDescription>Manage students in your institution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StudentManagement embedded={true} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                
                <TabsContent value="educational" className="p-0">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>{lang.structure.pageTitle} Configuration</CardTitle>
                      <CardDescription>{lang.structure.pageDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EducationalStructureTabContent canCreate={!isReadOnlySwitchedContext} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
