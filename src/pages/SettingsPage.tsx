
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users, GraduationCap, Building } from "lucide-react";
import { useAuth } from '@/contexts/auth';
import IncidentConfigurationContent from '@/components/configuration/IncidentConfigurationContent';
import UserManagement from '@/pages/UserManagement';
import StudentManagement from '@/pages/StudentManagement';
import { EducationalStructureConfig } from '@/pages/configuration/EducationalStructureConfig';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';

const SettingsPage = () => {
  const { activeTab, setActiveTab, loading, campuses, classes, sections, facilities, 
          handleAddCampus, handleUpdateCampus, handleDeleteCampus,
          handleAddClass, handleUpdateClass, handleDeleteClass,
          handleAddSection, handleUpdateSection, handleDeleteSection,
          handleAddFacility, handleUpdateFacility, handleDeleteFacility } = useEducationalConfigurationManagement();

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
            <TabsTrigger value="educational" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Educational Structure</span>
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
          
          <TabsContent value="user" className="p-0">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="student" className="p-0">
            <StudentManagement embedded={true} />
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
