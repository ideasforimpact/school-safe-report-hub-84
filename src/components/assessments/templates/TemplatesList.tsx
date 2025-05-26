import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, ClipboardList, Users, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DuplicateTemplateDialog from './DuplicateTemplateDialog';
interface TemplatesListProps {
  onCreateTemplate?: () => void;
}
const TemplatesList: React.FC<TemplatesListProps> = ({
  onCreateTemplate
}) => {
  const navigate = useNavigate();
  const {
    templates,
    deleteTemplate
  } = useAssessment();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assessment Templates</h2>
        {onCreateTemplate && <Button onClick={onCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>}
      </div>

      {templates.length === 0 ? <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create your first assessment template to start assigning assessments to users.
            </p>
            {onCreateTemplate && <Button onClick={onCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>}
          </CardContent>
        </Card> : <Card>
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => <TableRow key={template.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium" onClick={() => navigate(`/assessments/templates/${template.id}`)}>
                      {template.title}
                    </TableCell>
                    <TableCell>{template.type}</TableCell>
                    <TableCell>{template.questions.length}</TableCell>
                    <TableCell>{formatDate(template.createdAt)}</TableCell>
                    <TableCell>
                      {template.isActive ? <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                          Active
                        </Badge> : <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                          Inactive
                        </Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        
                        
                        <DuplicateTemplateDialog template={template} trigger={<Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                  }}>
                              <Copy className="h-4 w-4" />
                            </Button>} />
                        
                        <Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                    navigate(`/assessments/templates/${template.id}/edit`);
                  }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={e => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this template?')) {
                      deleteTemplate(template.id);
                    }
                  }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}
    </div>;
};
export default TemplatesList;