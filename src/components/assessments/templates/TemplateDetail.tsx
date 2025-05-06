
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Users, 
  ArrowLeft, 
  Check, 
  X,
  Paperclip, 
  MessageSquare 
} from 'lucide-react';

const TemplateDetail = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { getTemplateById } = useAssessment();
  const template = templateId ? getTemplateById(templateId) : null;

  if (!template) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Template not found</p>
        <Button 
          variant="link" 
          onClick={() => navigate('/assessments/templates')}
          className="mt-2"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/assessments/templates')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{template.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-blue-100 text-blue-800">{template.type}</Badge>
            {template.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/assessments/templates/${template.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => navigate(`/assessments/templates/${template.id}/assign`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Description</h3>
              <p className="mt-1 text-gray-600">{template.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Created</h3>
                <p className="mt-1 text-gray-600">{formatDate(template.createdAt)}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Questions</h3>
                <p className="mt-1 text-gray-600">{template.questions.length} questions</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Status</h3>
                <p className="mt-1 text-gray-600">{template.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Questions ({template.questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {template.questions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No questions in this template</p>
          ) : (
            <div className="space-y-4">
              {template.questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-start">
                    <span className="flex justify-center items-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">
                        {question.text}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.required ? (
                            <><Check className="h-3 w-3 mr-1" /> Required</>
                          ) : (
                            <><X className="h-3 w-3 mr-1" /> Optional</>
                          )}
                        </Badge>
                        
                        {question.allowComments && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comments
                          </Badge>
                        )}
                        
                        {question.allowAttachments && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            Attachments
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDetail;
