
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { TabsContent } from '@/components/ui/tabs';
import AssessmentResponseForm from '@/components/assessments/responses/AssessmentResponseForm';
import AssessmentsHeader from '@/components/assessments/header/AssessmentsHeader';
import AssessmentTabs from '@/components/assessments/tabs/AssessmentTabs';
import OverviewTab from '@/components/assessments/tabs/OverviewTab';
import { TemplateRoutes, AssignmentRoutes, ResultsRoutes } from '@/routes/assessmentRoutes';
import { summaryData, assessmentTypes, recentAssessments } from '@/components/assessments/data/mockData';

const AssessmentsPage = () => {
  const location = useLocation();
  console.log("Current location:", location.pathname);
  
  // Check if the current route is for responding to an assessment
  const isResponseRoute = location.pathname.includes('/respond');
  
  // Check if the current route is for creating a template
  const isCreateTemplateRoute = location.pathname.includes('/templates/new');
  
  // If it's a response route, render the response form directly
  if (isResponseRoute) {
    return (
      <Layout>
        <AssessmentResponseForm />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 w-full">
        {/* Header Section */}
        <AssessmentsHeader />
        
        {/* Main Tabs Navigation */}
        <AssessmentTabs defaultValue={isCreateTemplateRoute ? "templates" : "overview"}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              summaryData={summaryData}
              assessmentTypes={assessmentTypes}
              recentAssessments={recentAssessments}
            />
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="w-full">
            <TemplateRoutes />
          </TabsContent>
          
          {/* Assignments Tab */}
          <TabsContent value="assignments" className="w-full">
            <AssignmentRoutes />
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results" className="w-full">
            <ResultsRoutes />
          </TabsContent>
        </AssessmentTabs>
      </div>
    </Layout>
  );
};

export default AssessmentsPage;
