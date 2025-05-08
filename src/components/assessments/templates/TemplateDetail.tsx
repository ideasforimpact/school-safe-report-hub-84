
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Users, Copy } from 'lucide-react';
import DuplicateTemplateDialog from './DuplicateTemplateDialog';
import { toast } from 'sonner';

const TemplateDetail = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { getTemplateById, deleteTemplate } = useAssessment();
  
  const [template, setTemplate] = useState(templateId ? getTemplateById(templateId) : undefined);
  
  useEffect(() => {
    if (templateId) {
      const foundTemplate = getTemplateById(templateId);
      setTemplate(foundTemplate);
      
      if (!foundTemplate) {
        toast.error('Template not found');
        navigate('/assessments/templates');
      }
    } else {
      toast.error('No template selected');
      navigate('/assessments/templates');
    }
  }, [templateId, getTemplateById, navigate]);
  
  if (!template) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Template Not Found</h3>
        <p className="text-gray-600 mb-4">The requested template could not be found.</p>
        <Button onClick={() => navigate('/assessments/templates')}>
          Back to Templates
        </Button>
      </div>
    );
  }
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(template.id);
      toast.success('Template deleted successfully');
      navigate('/assessments/templates');
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">{template.title}</h2>
          <div className="flex items-center mt-2 space-x-3">
            <Badge variant="outline" className="bg-gray-100">
              {template.type}
            </Badge>
            <span className="text-sm text-gray-600">
              Created: {formatDate(template.createdAt)}
            </span>
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <DuplicateTemplateDialog 
            template={template}
            trigger={
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            }
          />
          
          <Button
            variant="outline"
            onClick={() => navigate(`/assessments/templates/${templateId}/assign`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(`/assessments/templates/${templateId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{template.description}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {template.questions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No questions added to this template yet.</p>
            </div>
          ) : (
            template.questions.map((question, index) => (
              <div key={question.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <p className="text-gray-700">{question.text}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {question.required && (
                        <Badge variant="outline" className="bg-red-50 text-red-800">
                          Required
                        </Badge>
                      )}
                      {question.allowComments && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          Comments Allowed
                        </Badge>
                      )}
                      {question.allowAttachments && (
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          Attachments Allowed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      <div className="pt-4 border-t mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/assessments/templates')}
        >
          Back to Templates
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleDelete}
        >
          Delete Template
        </Button>
      </div>
    </div>
  );
};

export default TemplateDetail;
