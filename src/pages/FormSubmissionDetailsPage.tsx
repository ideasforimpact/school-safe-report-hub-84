
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Users, Calendar, Download, Eye } from 'lucide-react';
import { useCustomForms } from '@/hooks/useCustomForms';

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submitterName: string;
  submitterEmail?: string;
  submittedAt: string;
  status: 'new' | 'reviewed' | 'resolved';
  responses: Array<{
    fieldId: string;
    question: string;
    answer: string;
    fieldType: string;
  }>;
}

const FormSubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { forms, loading } = useCustomForms();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    if (submissionId) {
      // Mock submission data
      const mockSubmission: FormSubmission = {
        id: submissionId,
        formId: 'form-1',
        formTitle: 'Student Feedback Form',
        submitterName: 'John Doe',
        submitterEmail: 'john.doe@example.com',
        submittedAt: '2024-01-25 10:30',
        status: 'new',
        responses: [
          {
            fieldId: 'field1',
            question: 'How would you rate your overall experience?',
            answer: 'Excellent',
            fieldType: 'radio_buttons'
          },
          {
            fieldId: 'field2',
            question: 'What did you like most about the course?',
            answer: 'The interactive sessions and practical examples were very helpful. The instructor was knowledgeable and engaging.',
            fieldType: 'text_area'
          },
          {
            fieldId: 'field3',
            question: 'Would you recommend this course to others?',
            answer: 'Yes',
            fieldType: 'radio_buttons'
          },
          {
            fieldId: 'field4',
            question: 'Please rate the course content (1-5 stars)',
            answer: '5',
            fieldType: 'rating'
          }
        ]
      };
      setSubmission(mockSubmission);
    }
  }, [submissionId]);

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      reviewed: 'secondary',
      resolved: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const renderResponseValue = (response: FormSubmission['responses'][0]) => {
    switch (response.fieldType) {
      case 'rating':
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`text-lg ${
                  index < parseInt(response.answer) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
            <span className="ml-2 text-sm text-gray-600">({response.answer}/5)</span>
          </div>
        );
      case 'text_area':
        return (
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="whitespace-pre-wrap">{response.answer}</p>
          </div>
        );
      default:
        return <p>{response.answer}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Loading submission details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Not Found</h3>
            <p className="text-gray-500 mb-4">The submission you're looking for could not be found.</p>
            <Button onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2 mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forms
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">View submission responses and details</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Submission Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Form</label>
                <p className="text-sm text-gray-900">{submission.formTitle}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Submitter</label>
                <p className="text-sm text-gray-900">{submission.submitterName}</p>
                {submission.submitterEmail && (
                  <p className="text-xs text-gray-500">{submission.submitterEmail}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  {getStatusBadge(submission.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-900">{submission.submittedAt}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Submission #{submission.id.substring(submission.id.length - 8)}</h2>
              <p className="text-gray-600 mt-1">Form responses from {submission.submitterName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-semibold">{submission.responses.length}</div>
                <div className="text-sm text-gray-500">Responses</div>
              </div>
            </div>
          </div>
        </div>

        {/* Responses Content */}
        <div className="flex-1 p-6">
          <Tabs defaultValue="responses" className="h-full">
            <TabsList className="mb-6">
              <TabsTrigger value="responses" className="gap-2">
                <FileText className="h-4 w-4" />
                Responses
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                <Users className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="responses" className="space-y-6">
              {submission.responses.map((response, index) => (
                <Card key={response.fieldId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-start justify-between">
                      <span className="flex-1">Q{index + 1}. {response.question}</span>
                      <Badge variant="outline" className="text-xs">
                        {response.fieldType.replace('_', ' ')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderResponseValue(response)}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Submission Summary</CardTitle>
                  <CardDescription>Overview of form responses and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Response Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Questions:</span>
                          <span className="font-medium">{submission.responses.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Answered:</span>
                          <span className="font-medium">{submission.responses.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completion:</span>
                          <span className="font-medium text-green-600">100%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Field Types Used</h4>
                      <div className="space-y-2">
                        {Array.from(new Set(submission.responses.map(r => r.fieldType))).map(type => (
                          <div key={type} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}:</span>
                            <span className="font-medium">
                              {submission.responses.filter(r => r.fieldType === type).length}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FormSubmissionDetailsPage;
