
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Edit, Play } from "lucide-react";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useAssessments } from "@/hooks/useAssessments";
import { useToast } from "@/components/ui/use-toast";

interface AssessmentTemplatesTableProps {
  templates: AssessmentTemplate[];
  sortField: 'name' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt') => void;
}

const AssessmentTemplatesTable = ({
  templates,
  sortField,
  sortDirection,
  onSort,
}: AssessmentTemplatesTableProps) => {
  const navigate = useNavigate();
  const { getAssignmentsByTemplate, updateTemplateStatus } = useAssessments();
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Draft</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };
  
  const getCompletionStatus = (template: AssessmentTemplate) => {
    if (template.questions.length === 0) {
      return <Badge variant="outline" className="text-red-500 border-red-500">Incomplete</Badge>;
    }
    return <Badge variant="outline" className="text-green-500 border-green-500">Complete</Badge>;
  };
  
  const getDueDateFormat = (assignments: any[]) => {
    if (assignments.length === 0) return "—";
    
    const dueDates = assignments
      .filter(a => a.dueDate)
      .map(a => new Date(a.dueDate));
    
    if (dueDates.length === 0) return "No due date";
    
    // Get the earliest due date
    const earliestDueDate = new Date(Math.min(...dueDates.map(d => d.getTime())));
    return earliestDueDate.toLocaleDateString();
  };

  const handleActivate = (templateId: string) => {
    updateTemplateStatus(templateId, 'active');
    toast({
      title: "Template activated",
      description: "The template has been activated successfully."
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[280px] cursor-pointer" onClick={() => onSort('name')}>
            <div className="flex items-center">
              Template Name
              {sortField === 'name' && (
                <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
              )}
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Completion</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="cursor-pointer" onClick={() => onSort('createdAt')}>
            <div className="flex items-center">
              Created
              {sortField === 'createdAt' && (
                <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
              )}
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => {
          const templateAssignments = getAssignmentsByTemplate(template.id);
          const isComplete = template.questions.length > 0;
          const isActive = template.status === 'active';
          
          return (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{getStatusBadge(template.status)}</TableCell>
              <TableCell>{getCompletionStatus(template)}</TableCell>
              <TableCell>{template.questions.length}</TableCell>
              <TableCell>{templateAssignments.length} user(s)</TableCell>
              <TableCell>{getDueDateFormat(templateAssignments)}</TableCell>
              <TableCell>
                {new Date(template.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {isComplete && !isActive && (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleActivate(template.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant={isComplete ? "outline" : "default"}
                    onClick={() => navigate(`/assessment/${template.id}`)}
                  >
                    {isComplete ? (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    ) : (
                      <>
                        Add Questions
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AssessmentTemplatesTable;
