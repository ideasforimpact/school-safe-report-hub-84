
import React from 'react';
import { PlusCircle, CheckCircle, ClipboardList, AlertTriangle, BarChart } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import AssessmentCard from '@/components/assessments/AssessmentCard';
import AssessmentSummaryCards from '@/components/assessments/AssessmentSummaryCards';
import RecentAssessmentsTable from '@/components/assessments/RecentAssessmentsTable';

const AssessmentsPage = () => {
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
      <div className="space-y-6 md:space-y-8 w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assessments</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Create, manage, and review safety and compliance assessments
            </p>
          </div>
          
          <Button className="whitespace-nowrap">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>

        {/* Summary Cards */}
        <AssessmentSummaryCards data={summaryData} />
        
        {/* Assessment Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {assessmentTypes.map(assessment => (
            <AssessmentCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
        
        {/* Tabbed Interface */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-md mb-6">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="w-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAssessmentsTable assessments={recentAssessments} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Active Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Currently active assessments that need attention or are in progress.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Completed Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Review previously completed assessments and their results.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Scheduled Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Upcoming assessments that have been scheduled for the future.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Analytics Preview */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl font-medium">Assessment Analytics</CardTitle>
              <Button variant="outline" size="sm" className="text-xs">
                <BarChart className="h-4 w-4 mr-1" />
                View Full Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-100 rounded-lg h-64 flex items-center justify-center">
              <p className="text-gray-500">Assessment trend data visualization will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssessmentsPage;
