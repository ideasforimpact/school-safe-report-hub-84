
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Calendar, BarChart3, List, Eye } from 'lucide-react';
import Layout from '@/components/layout/Layout';

interface Form {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  submissions: number;
  isActive: boolean;
}

interface Submission {
  id: string;
  formId: string;
  submitterName: string;
  submittedAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

const FormsPage = () => {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [submissionsView, setSubmissionsView] = useState<'list' | 'aggregated'>('list');

  // Mock data
  const forms: Form[] = [
    {
      id: '1',
      name: 'Student Feedback Form',
      description: 'Collect feedback from students about their learning experience',
      createdAt: '2024-01-15',
      submissions: 23,
      isActive: true
    },
    {
      id: '2',
      name: 'Teacher Evaluation',
      description: 'Annual teacher performance evaluation form',
      createdAt: '2024-01-10',
      submissions: 8,
      isActive: false
    },
    {
      id: '3',
      name: 'Course Feedback',
      description: 'Feedback on course content and delivery',
      createdAt: '2024-01-20',
      submissions: 15,
      isActive: true
    }
  ];

  const submissions: Submission[] = [
    {
      id: '1',
      formId: '1',
      submitterName: 'John Doe',
      submittedAt: '2024-01-25 10:30',
      status: 'new'
    },
    {
      id: '2',
      formId: '1',
      submitterName: 'Jane Smith',
      submittedAt: '2024-01-24 14:20',
      status: 'reviewed'
    },
    {
      id: '3',
      formId: '1',
      submitterName: 'Mike Johnson',
      submittedAt: '2024-01-23 09:15',
      status: 'resolved'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      reviewed: 'secondary',
      resolved: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getSubmissionStats = () => {
    const formSubmissions = submissions.filter(s => s.formId === selectedForm?.id);
    const statusCounts = formSubmissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return statusCounts;
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Forms
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your forms and submissions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {forms.map((form) => (
                <Card 
                  key={form.id} 
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedForm?.id === form.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedForm(form)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm truncate">{form.name}</h3>
                      <Badge variant={form.isActive ? "default" : "secondary"} className="text-xs">
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{form.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {form.createdAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {form.submissions} submissions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedForm ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedForm.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedForm.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{selectedForm.submissions}</div>
                      <div className="text-sm text-gray-500">Total Submissions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions Content */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Submissions</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={submissionsView === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSubmissionsView('list')}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      List View
                    </Button>
                    <Button
                      variant={submissionsView === 'aggregated' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSubmissionsView('aggregated')}
                      className="gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Aggregated View
                    </Button>
                  </div>
                </div>

                <Tabs value={submissionsView} onValueChange={(value) => setSubmissionsView(value as 'list' | 'aggregated')}>
                  <TabsContent value="list" className="mt-0">
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Submitter</TableHead>
                              <TableHead>Submitted At</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submissions
                              .filter(sub => sub.formId === selectedForm.id)
                              .map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium">{submission.submitterName}</TableCell>
                                <TableCell>{submission.submittedAt}</TableCell>
                                <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="aggregated" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(getSubmissionStats()).map(([status, count]) => (
                        <Card key={status}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium capitalize">{status} Submissions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{count}</div>
                            <p className="text-xs text-gray-500">
                              {((count / selectedForm.submissions) * 100).toFixed(1)}% of total
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg">Submission Timeline</CardTitle>
                        <CardDescription>Recent submission activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {submissions
                            .filter(sub => sub.formId === selectedForm.id)
                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                            .slice(0, 5)
                            .map((submission) => (
                            <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                  <div className="font-medium">{submission.submitterName}</div>
                                  <div className="text-sm text-gray-500">{submission.submittedAt}</div>
                                </div>
                              </div>
                              {getStatusBadge(submission.status)}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Form</h3>
                <p className="text-gray-500">Choose a form from the sidebar to view its submissions and analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FormsPage;
