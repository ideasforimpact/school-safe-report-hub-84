
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Eye, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useFetchForms } from '@/hooks/useFetchForms';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import SubmissionDetailDialog from '@/components/forms/SubmissionDetailDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FormsPage = () => {
  const { forms, loading, error } = useFetchForms();
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { submissions, loading: submissionsLoading, refetch } = useFormSubmissions(selectedForm?.id || null);

  // Enhanced debug logging
  console.log('FormsPage Enhanced Debug:', {
    selectedFormId: selectedForm?.id,
    selectedFormTitle: selectedForm?.title,
    submissionsCount: submissions.length,
    submissionsLoading,
    submissions: submissions.map(sub => ({
      id: sub.id,
      submitter_name: sub.submitter_name,
      status: sub.status,
      created_at: sub.created_at,
      comments: sub.comments,
      hasAllFields: !!(sub.submitter_name && sub.status && sub.created_at)
    }))
  });

  // Filter submissions based on search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) {
      return submissions;
    }

    const searchLower = searchTerm.toLowerCase();
    
    return submissions.filter((submission) => {
      // Search in submitter name
      if (submission.submitter_name?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in submitter email
      if (submission.submitter_email?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in status
      if (submission.status?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in comments
      if (submission.comments?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in responses data
      if (submission.responses && Array.isArray(submission.responses)) {
        return submission.responses.some((response: any) => {
          // Check if response has answer property
          if (response.answer && typeof response.answer === 'string') {
            return response.answer.toLowerCase().includes(searchLower);
          }
          
          // Check if response has value property
          if (response.value && typeof response.value === 'string') {
            return response.value.toLowerCase().includes(searchLower);
          }
          
          // Search in any string properties of the response object
          return Object.values(response).some((value) => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchLower);
            }
            return false;
          });
        });
      }
      
      return false;
    });
  }, [submissions, searchTerm]);

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      open: 'secondary',
      reviewed: 'secondary',
      closed: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewSubmission = (submission: any) => {
    console.log('Opening submission detail for:', submission);
    setSelectedSubmission(submission);
  };

  const handleSubmissionUpdate = () => {
    refetch();
  };

  // Function to truncate comments and show full text on hover
  const renderComments = (comments: string | null) => {
    if (!comments) {
      return <span className="text-gray-400">-</span>;
    }

    if (comments.length <= 20) {
      return <span>{comments}</span>;
    }

    const truncated = comments.substring(0, 20) + '...';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{truncated}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs break-words">
            <p>{comments}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {forms.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No Forms Found</h3>
                <p className="text-sm text-gray-500 mb-4">No custom forms available.</p>
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
                      <div className="text-2xl font-bold">{filteredSubmissions.length}</div>
                      <div className="text-sm text-gray-500">
                        {searchTerm ? 'Filtered Results' : 'Total Submissions'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Submissions */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Submissions</h3>
                  
                  {/* Search Input */}
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search submissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {submissionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading submissions...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Submitter</TableHead>
                              <TableHead className="w-[200px]">Submitted At</TableHead>
                              <TableHead className="w-[200px]">Comments</TableHead>
                              <TableHead className="w-[120px]">Status</TableHead>
                              <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSubmissions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                  {searchTerm ? 'No submissions match your search' : 'No submissions yet'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredSubmissions.map((submission, index) => {
                                // Enhanced debug logging for each submission
                                console.log(`Rendering submission ${index}:`, {
                                  id: submission.id,
                                  submitter_name: submission.submitter_name,
                                  submitter_email: submission.submitter_email,
                                  status: submission.status,
                                  created_at: submission.created_at,
                                  comments: submission.comments,
                                  hasResponses: submission.responses && Array.isArray(submission.responses),
                                  responsesLength: submission.responses?.length,
                                  fullSubmission: submission
                                });
                                
                                return (
                                  <TableRow key={submission.id}>
                                    <TableCell className="w-[200px] font-medium">
                                      <div className="truncate">
                                        {submission.submitter_name || 'Anonymous'}
                                        {submission.submitter_email && (
                                          <div className="text-xs text-gray-500 truncate">
                                            {submission.submitter_email}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                      {submission.created_at ? formatDate(submission.created_at) : 'Unknown'}
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                      {renderComments(submission.comments)}
                                    </TableCell>
                                    <TableCell className="w-[120px]">
                                      {submission.status ? getStatusBadge(submission.status) : 
                                        <Badge variant="secondary">Unknown</Badge>
                                      }
                                    </TableCell>
                                    <TableCell className="w-[120px] text-right">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="gap-1"
                                        onClick={() => handleViewSubmission(submission)}
                                      >
                                        <Eye className="h-4 w-4" />
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
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

      {/* Submission Detail Dialog */}
      {selectedSubmission && (
        <SubmissionDetailDialog
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={handleSubmissionUpdate}
        />
      )}
    </Layout>
  );
};

export default FormsPage;
