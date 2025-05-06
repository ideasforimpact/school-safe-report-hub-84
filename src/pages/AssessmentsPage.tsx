
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, ClipboardList, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssessmentCard from '@/components/assessments/AssessmentCard';
import AssessmentSummaryCards from '@/components/assessments/AssessmentSummaryCards';
import RecentAssessmentsTable from '@/components/assessments/RecentAssessmentsTable';
import { AssessmentProvider } from '@/contexts/assessment/AssessmentContext';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplateDetail from '@/components/assessments/templates/TemplateDetail';
import AssignTemplateForm from '@/components/assessments/assignments/AssignTemplateForm';
import BulkAssignForm from '@/components/assessments/assignments/BulkAssignForm';
import AssignmentsList from '@/components/assessments/assignments/AssignmentsList';
import AssessmentResponseForm from '@/components/assessments/responses/AssessmentResponseForm';
import ResultsAnalytics from '@/components/assessments/results/ResultsAnalytics';

const AssessmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on the URL path
  const getActiveTab = () => {
    if (location.pathname.includes('/templates')) return 'templates';
    if (location.pathname.includes('/assignments')) return 'assignments';
    if (location.pathname.includes('/results')) return 'results';
    if (location.pathname.includes('/respond')) return 'assignments'; // This ensures respond still shows assignments tab as active
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTab());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch(value) {
      case 'templates':
        navigate('/assessments/templates');
        break;
      case 'assignments':
        navigate('/assessments/assignments');
        break;
      case 'results':
        navigate('/assessments/results');
        break;
      default:
        navigate('/assessments');
    }
  };
  
  // Mock data for demonstration
  const summaryData = {
    total: 24,
    completed: 16,
    pending: 8,
    averageScore: 85,
  };

  const assessmentTypes = [
    {
      id: 1,
      title: 'Safety Assessments',
      description: 'Evaluate and maintain safety protocols in your facilities',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      count: 12,
      progress: 75
    },
    {
      id: 2,
      title: 'Compliance Checks',
      description: 'Ensure adherence to regulations and safety standards',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      count: 8,
      progress: 90
    },
    {
      id: 3,
      title: 'Risk Evaluations',
      description: 'Identify and analyze potential risks in your environment',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: 4,
      progress: 60
    },
  ];

  const recentAssessments = [
    { id: 'A-2023-001', title: 'Annual Fire Safety Check', type: 'Safety', status: 'Completed', date: '2023-10-15', score: 92 },
    { id: 'A-2023-002', title: 'Quarterly Building Inspection', type: 'Compliance', status: 'In Review', date: '2023-11-05', score: 78 },
    { id: 'A-2023-003', title: 'Emergency Response Test', type: 'Safety', status: 'Pending', date: '2023-11-20', score: null },
    { id: 'A-2023-004', title: 'Staff Safety Training Evaluation', type: 'Training', status: 'Completed', date: '2023-10-28', score: 88 },
    { id: 'A-2023-005', title: 'Environmental Risk Assessment', type: 'Risk', status: 'In Progress', date: '2023-11-10', score: null },
  ];

  return (
    <Layout>
      <AssessmentProvider>
        <div className="space-y-6 md:space-y-8 w-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assessments</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Create, manage, and review safety and compliance assessments
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => navigate('/assessments/templates/new')}
                className="whitespace-nowrap"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          {/* Main Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 max-w-md mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <AssessmentSummaryCards data={summaryData} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {assessmentTypes.map(assessment => (
                  <AssessmentCard key={assessment.id} assessment={assessment} />
                ))}
              </div>
              
              <div className="mt-6">
                <RecentAssessmentsTable assessments={recentAssessments} />
              </div>
            </TabsContent>
            
            {/* Templates Tab */}
            <TabsContent value="templates" className="w-full">
              <Routes>
                <Route index element={<TemplatesList />} />
                <Route path="new" element={<CreateTemplateForm />} />
                <Route path=":templateId" element={<TemplateDetail />} />
                <Route path=":templateId/edit" element={<CreateTemplateForm />} />
                <Route path=":templateId/assign" element={<AssignTemplateForm />} />
                <Route path=":templateId/bulk-assign" element={<BulkAssignForm />} />
              </Routes>
            </TabsContent>
            
            {/* Assignments Tab */}
            <TabsContent value="assignments" className="w-full">
              <Routes>
                <Route index element={<AssignmentsList />} />
                <Route path="bulk-assign" element={<BulkAssignForm />} />
              </Routes>
            </TabsContent>
            
            {/* Results Tab */}
            <TabsContent value="results" className="w-full">
              <Routes>
                <Route index element={<ResultsAnalytics />} />
              </Routes>
            </TabsContent>

            {/* Response Form - Place outside of tabs but inside the AssessmentProvider */}
            <Routes>
              <Route path=":assignmentId/respond" element={<AssessmentResponseForm />} />
            </Routes>
          </Tabs>
        </div>
      </AssessmentProvider>
    </Layout>
  );
};

export default AssessmentsPage;
