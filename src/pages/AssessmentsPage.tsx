
import React, { useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { TabsContent } from '@/components/ui/tabs';
import AssessmentResponseForm from '@/components/assessments/responses/AssessmentResponseForm';
import AssessmentsHeader from '@/components/assessments/header/AssessmentsHeader';
import AssessmentTabs from '@/components/assessments/tabs/AssessmentTabs';
import OverviewTab from '@/components/assessments/tabs/OverviewTab';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
import TemplateDetail from '@/components/assessments/templates/TemplateDetail';
import AssignTemplateForm from '@/components/assessments/assignments/AssignTemplateForm';
import BulkAssignForm from '@/components/assessments/assignments/BulkAssignForm';
import AssignmentsList from '@/components/assessments/assignments/AssignmentsList';
import ResultsAnalytics from '@/components/assessments/results/ResultsAnalytics';
import { summaryData, assessmentTypes, recentAssessments } from '@/components/assessments/data/mockData';

const AssessmentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  
  console.log("Current location:", location.pathname);
  
  // Check if the current route is for responding to an assessment
  const isResponseRoute = location.pathname.includes('/respond/');
  
  // If it's a response route, render the response form directly
  if (isResponseRoute) {
    return (
      <Layout>
        <AssessmentResponseForm />
      </Layout>
    );
  }

  // Handle template creation button click
  const handleCreateTemplate = () => {
    console.log("Create template button clicked");
    setShowCreateTemplate(true);
  };

  // Handle template creation cancellation
  const handleCancelCreate = () => {
    setShowCreateTemplate(false);
  };

  // Determine which template content to show
  const renderTemplateContent = () => {
    if (showCreateTemplate) {
      return <CreateTemplateForm onCancel={handleCancelCreate} />;
    }
    
    // Parse the path to determine what to render
    if (location.pathname.includes('/templates/new')) {
      return <CreateTemplateForm onCancel={handleCancelCreate} />;
    } else if (location.pathname.match(/\/templates\/[^/]+\/edit$/)) {
      return <CreateTemplateForm templateId={location.pathname.split('/')[3]} onCancel={handleCancelCreate} />;
    } else if (location.pathname.match(/\/templates\/[^/]+\/assign$/)) {
      // We'll let the component handle getting the templateId from the URL params
      return <AssignTemplateForm />;
    } else if (location.pathname.match(/\/templates\/[^/]+\/bulk-assign$/)) {
      // We'll let the component handle getting the templateId from the URL params
      return <BulkAssignForm />;
    } else if (location.pathname.match(/\/templates\/[^/]+$/)) {
      // We'll let the component handle getting the templateId from the URL params
      return <TemplateDetail />;
    } else {
      return <TemplatesList onCreateTemplate={handleCreateTemplate} />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 w-full">
        {/* Header Section with Create Template Button */}
        <AssessmentsHeader onCreateTemplate={handleCreateTemplate} />
        
        {/* Main Tabs Navigation */}
        <AssessmentTabs defaultValue={showCreateTemplate ? "templates" : "overview"}>
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
            {renderTemplateContent()}
          </TabsContent>
          
          {/* Assignments Tab */}
          <TabsContent value="assignments" className="w-full">
            <AssignmentsList />
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results" className="w-full">
            <ResultsAnalytics />
          </TabsContent>
        </AssessmentTabs>
      </div>
    </Layout>
  );
};

export default AssessmentsPage;
