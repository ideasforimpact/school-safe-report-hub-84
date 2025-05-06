
import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart } from 'lucide-react';

const ResultsAnalytics = () => {
  const { templates, assignments, responses } = useAssessment();

  // Calculate completion rate
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
  const completionRate = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  // Calculate average score
  const submittedResponses = responses.filter(r => r.status === 'Submitted' && r.score !== null);
  const totalScore = submittedResponses.reduce((sum, response) => sum + (response.score || 0), 0);
  const averageScore = submittedResponses.length > 0 
    ? Math.round(totalScore / submittedResponses.length) 
    : 0;
  
  // Count by template type
  const templateTypeCounts = templates.reduce((acc, template) => {
    acc[template.type] = (acc[template.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate overdue assignments
  const overdueAssignments = assignments.filter(a => {
    return a.status !== 'Completed' && new Date(a.dueDate) < new Date();
  }).length;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Assessment Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{completionRate}%</p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {completedAssignments} of {totalAssignments} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{averageScore}%</p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${averageScore}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Based on {submittedResponses.length} submitted assessments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{overdueAssignments}</p>
            <p className="text-sm text-gray-500 mt-2">
              Assessments past due date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{templates.length}</p>
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              {Object.entries(templateTypeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span>{type}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-500" />
              Completion by Template Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Bar chart visualization would appear here</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-purple-500" />
              Assessment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Pie chart visualization would appear here</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No assessment responses yet</p>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Table of recent assessment results would appear here
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsAnalytics;
