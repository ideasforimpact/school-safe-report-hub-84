
import React, { useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { TabsContent } from '@/components/ui/tabs';
import AssessmentsHeader from '@/components/assessments/header/AssessmentsHeader';
import AssessmentTabs from '@/components/assessments/tabs/AssessmentTabs';
import OverviewTab from '@/components/assessments/tabs/OverviewTab';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import CreateAssessmentForm from '@/components/assessments/create/CreateAssessmentForm';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
import TemplateDetail from '@/components/assessments/templates/TemplateDetail';
import AssignTemplateForm from '@/components/assessments/assignments/AssignTemplateForm';
import BulkAssignForm from '@/components/assessments/assignments/BulkAssignForm';
import AssignmentsList from '@/components/assessments/assignments/AssignmentsList';
import ResultsAnalytics from '@/components/assessments/results/ResultsAnalytics';
import { summaryData, assessmentTypes, recentAssessments } from '@/components/assessments/data/mockData';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';

const AssessmentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAssessmentAdmin } = useAssessmentAccess();
  
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  
  console.log("Current location:", location.pathname);
  console.log("Has assessment admin access:", hasAssessmentAdmin);
  
  // Handle assessment creation button click
  const handleCreateAssessment = () => {
    console.log("Create assessment button clicked");
    setShowCreateAssessment(true);
    setShowCreateTemplate(false);
  };

  // Handle template creation button click (keeping existing functionality)
  const handleCreateTemplate = () => {
    console.log("Create template button clicked");
    setShowCreateTemplate(true);
    setShowCreateAssessment(false);
  };

  // Handle assessment creation cancellation
  const handleCancelCreateAssessment = () => {
    setShowCreateAssessment(false);
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
      return <AssignTemplateForm />;
    } else if (location.pathname.match(/\/templates\/[^/]+\/bulk-assign$/)) {
      return <BulkAssignForm />;
    } else if (location.pathname.match(/\/templates\/[^/]+$/)) {
      return <TemplateDetail />;
    } else {
      return <TemplatesList onCreateTemplate={handleCreateTemplate} />;
    }
  };

  // Determine main content based on state
  const renderMainContent = () => {
    if (showCreateAssessment) {
      return <CreateAssessmentForm onCancel={handleCancelCreateAssessment} />;
    }

    return (
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
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Gradient Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg mb-8 text-white">
          <div className="p-8">
            <AssessmentsHeader onCreateTemplate={handleCreateAssessment} />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderMainContent()}
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentsPage;
