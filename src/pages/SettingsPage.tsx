
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users, GraduationCap } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import IncidentConfigurationContent from '@/components/configuration/IncidentConfigurationContent';
import UserManagement from '@/pages/UserManagement';
import StudentManagement from '@/pages/StudentManagement';

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure system settings</p>
        </div>
        
        <Tabs defaultValue="incident" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="incident" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Incident Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Student Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="incident" className="bg-white p-6 rounded-lg border">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Incident Configuration</CardTitle>
                <CardDescription>Configure incident categories, priorities, and other settings</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <IncidentConfigurationContent />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="user" className="bg-white p-0 rounded-lg border">
            <UserManagement embedded={true} />
          </TabsContent>
          
          <TabsContent value="student" className="bg-white p-0 rounded-lg border">
            <StudentManagement embedded={true} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
