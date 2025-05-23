
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users, GraduationCap } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import UserManagementContent from '@/components/configuration/UserManagementContent';
import StudentManagementContent from '@/components/configuration/StudentManagementContent';
import IncidentConfigurationContent from '@/components/configuration/IncidentConfigurationContent';

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
          
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementContent />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Manage student records and information</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentManagementContent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
