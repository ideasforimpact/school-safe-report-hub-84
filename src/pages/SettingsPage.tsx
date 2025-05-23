
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, AlertTriangle, School, Users, GraduationCap, Shield, Key, BellRing, Globe } from "lucide-react";
import GeneralSettingsForm from '@/components/backoffice/settings/GeneralSettingsForm';
import SecuritySettingsForm from '@/components/backoffice/settings/SecuritySettingsForm';
import OAuthSettingsForm from '@/components/backoffice/settings/OAuthSettingsForm';
import NotificationSettingsForm from '@/components/backoffice/settings/NotificationSettingsForm';
import RegionalSettingsForm from '@/components/backoffice/settings/RegionalSettingsForm';

const SettingsPage = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Safe School Management",
    supportEmail: "support@safeschool.com",
    notificationsEnabled: true,
    maintenanceMode: false,
    autoLogout: true
  });
  
  const handleGeneralSettingChange = (key: string, value: string | boolean) => {
    setGeneralSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure system settings</p>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>OAuth Providers</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Regional</span>
            </TabsTrigger>
            <TabsTrigger value="incident" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Incident Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              <span>Educational Structure</span>
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
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage basic system configuration settings</CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralSettingsForm 
                  settings={generalSettings}
                  onSettingChange={handleGeneralSettingChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and access control settings</CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="oauth">
            <Card>
              <CardHeader>
                <CardTitle>OAuth Provider Settings</CardTitle>
                <CardDescription>Configure OAuth provider credentials for client authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <OAuthSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="regional">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Configure localization and regional preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <RegionalSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="incident">
            <Card>
              <CardHeader>
                <CardTitle>Incident Configuration</CardTitle>
                <CardDescription>Configure incident categories, priorities, and other settings</CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-center">
                  <a href="/incident-configuration" className="text-blue-600 hover:underline">
                    Go to Incident Configuration
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Educational Structure</CardTitle>
                <CardDescription>Configure educational structure settings</CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-center">
                  <a href="/educational-configuration" className="text-blue-600 hover:underline">
                    Go to Educational Structure Configuration
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-center">
                  <a href="/users" className="text-blue-600 hover:underline">
                    Go to User Management
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Manage student records and information</CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-center">
                  <a href="/students" className="text-blue-600 hover:underline">
                    Go to Student Management
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
