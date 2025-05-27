
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Calendar, BarChart3, List, Eye, Plus, Edit, Share2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCustomForms } from '@/hooks/useCustomForms';
import { toast } from 'sonner';

interface FormSubmission {
  id: string;
  formId: string;
  submitterName: string;
  submittedAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

const FormsPage = () => {
  const { forms, loading, error } = useCustomForms();
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [submissionsView, setSubmissionsView] = useState<'list' | 'aggregated'>('list');

  // Mock submissions data - in a real app, this would come from the database
  const submissions: FormSubmission[] = [
    {
      id: '1',
      formId: selectedForm?.id || '',
      submitterName: 'John Doe',
      submittedAt: '2024-01-25 10:30',
      status: 'new'
    },
    {
      id: '2',
      formId: selectedForm?.id || '',
      submitterName: 'Jane Smith',
      submittedAt: '2024-01-24 14:20',
      status: 'reviewed'
    },
    {
      id: '3',
      formId: selectedForm?.id || '',
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

  const handleCreateForm = () => {
    toast.info('Form creation functionality coming soon!');
  };

  const handleEditForm = (formId: string) => {
    toast.info('Form editing functionality coming soon!');
  };

  const handleShareForm = (formId: string) => {
    toast.info('Form sharing functionality coming soon!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading forms...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Forms</h3>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Forms
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage your custom forms</p>
              </div>
              <Button onClick={handleCreateForm} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {forms.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No Forms Found</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first custom form to get started.</p>
                <Button onClick={handleCreateForm} size="sm">
                  Create Form
                </Button>
              </div>
            ) : (
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
                        <h3 className="font-medium text-sm truncate">{form.title}</h3>
                        <Badge variant={form.is_active ? "default" : "secondary"} className="text-xs">
                          {form.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{form.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(form.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {form.fields?.length || 0} fields
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditForm(form.id);
                          }}
                          className="flex-1 gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareForm(form.id);
                          }}
                          className="flex-1 gap-1"
                        >
                          <Share2 className="h-3 w-3" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                    <h2 className="text-2xl font-bold">{selectedForm.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedForm.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{submissions.length}</div>
                      <div className="text-sm text-gray-500">Total Submissions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Details */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Form Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Status:</dt>
                          <dd>
                            <Badge variant={selectedForm.is_active ? "default" : "secondary"}>
                              {selectedForm.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Fields:</dt>
                          <dd>{selectedForm.fields?.length || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Created:</dt>
                          <dd>{new Date(selectedForm.created_at).toLocaleDateString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Updated:</dt>
                          <dd>{new Date(selectedForm.updated_at).toLocaleDateString()}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Form Fields</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedForm.fields?.map((field: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{field.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                        ))}
                        {(!selectedForm.fields || selectedForm.fields.length === 0) && (
                          <p className="text-sm text-gray-500 italic">No fields configured</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                            {submissions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                  No submissions yet
                                </TableCell>
                              </TableRow>
                            ) : (
                              submissions.map((submission) => (
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
                              ))
                            )}
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
                              {submissions.length > 0 ? ((count / submissions.length) * 100).toFixed(1) : 0}% of total
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                        <CardDescription>Latest form submissions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {submissions.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4">No recent activity</p>
                          ) : (
                            submissions
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
                              ))
                          )}
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
                <p className="text-gray-500">Choose a form from the sidebar to view its details and submissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FormsPage;
