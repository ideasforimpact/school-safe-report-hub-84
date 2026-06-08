
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
import EducationalStructureTab from '@/components/configuration/EducationalStructureTab';
import AssessmentConfigurationContent from '@/components/configuration/AssessmentConfigurationContent';
import FormConfigurationContent from '@/components/configuration/FormConfigurationContent';
import GroupConfigurationContent from '@/components/configuration/GroupConfigurationContent';
import { useClientIntegration } from '@/hooks/useClientIntegration';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const { user, employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const [clientType, setClientType] = useState<string | null>(null);

  const defaultTab = searchParams.get('tab') === 'form' ? 'form' : 'incident';
  // Only mount a tab's content the first time it is visited
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([defaultTab]));
  const markVisited = (tab: string) => setVisitedTabs(prev => new Set(prev).add(tab));

  const { isClientLinked } = useClientIntegration();

  useEffect(() => {
    let detectedClientType = null;
    if (employeeData?.clientType?.key) {
      detectedClientType = employeeData.clientType.key;
    } else if (employeeData?.client?.client_type?.key) {
      detectedClientType = employeeData.client.client_type.key;
    } else if (user?.clientType?.key) {
      detectedClientType = user.clientType.key;
    } else if (user?.client?.client_type?.key) {
      detectedClientType = user.client.client_type.key;
    }
    setClientType(detectedClientType);
  }, [employeeData, user]);

  const showEducationalTabs =
    clientType === 'school' ||
    clientType === 'college' ||
    clientType === 'university' ||
    clientType === 'educational';

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
          <Tabs defaultValue={defaultTab} className="w-full pl-5 pr-[25px]" onValueChange={markVisited}>
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
                  <TabsTrigger
                    value="student"
                    className="flex items-center gap-2"
                    disabled={isClientLinked}
                    title={isClientLinked ? "Student Management is disabled when client integration is linked" : ""}
                  >
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
                  {visitedTabs.has('incident') && <IncidentConfigurationContent />}
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
                  {visitedTabs.has('assessment') && <AssessmentConfigurationContent embedded={true} />}
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
                  {visitedTabs.has('form') && <FormConfigurationContent />}
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
                  {visitedTabs.has('user') && <UserManagement embedded={true} />}
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
                  {visitedTabs.has('group') && <GroupConfigurationContent />}
                </CardContent>
              </Card>
            </TabsContent>
            {showEducationalTabs && (
              <>
                <TabsContent value="student" className="p-0">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Student Management</CardTitle>
                      <CardDescription>Manage students in your institution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {visitedTabs.has('student') && <StudentManagement embedded={true} />}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="educational" className="p-0">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Educational Structure Configuration</CardTitle>
                      <CardDescription>Manage campuses, classes, sections, and facilities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {visitedTabs.has('educational') && <EducationalStructureTab />}
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
