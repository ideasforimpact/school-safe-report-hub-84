import React from 'react';
import { AssessmentTemplate } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Calendar, User } from 'lucide-react';

interface TemplateDetailViewProps {
  template: AssessmentTemplate;
  onBack: () => void;
  onEdit: () => void;
}

const TemplateDetailView: React.FC<TemplateDetailViewProps> = ({
  template,
  onBack,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <h2 className="text-xl font-semibold">{template.title}</h2>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Template Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1">{template.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="mt-1 font-medium">{template.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {template.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Template Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Created Date</label>
              <p className="text-sm">{formatDate(template.createdAt)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Questions</label>
              <p className="text-sm font-medium">{template.questions.length} questions</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Created By</label>
              <p className="text-sm">{template.createdBy || 'System'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({template.questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {template.questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No questions in this template</p>
          ) : (
            <div className="space-y-4">
              {template.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{question.text}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {question.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        {question.allowComments && (
                          <Badge variant="outline" className="text-xs">Comments Allowed</Badge>
                        )}
                        {question.allowAttachments && (
                          <Badge variant="outline" className="text-xs">Attachments Allowed</Badge>
                        )}
                        {question.files && question.files.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {question.files.length} Files
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

export default TemplateDetailView;