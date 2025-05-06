
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
import { ArrowUpDown } from "lucide-react";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useAssessments } from "@/hooks/useAssessments";

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
  const { getAssignmentsByTemplate } = useAssessments();

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px] cursor-pointer" onClick={() => onSort('name')}>
            <div className="flex items-center">
              Template Name
              {sortField === 'name' && (
                <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
              )}
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
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
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => {
          const templateAssignments = getAssignmentsByTemplate(template.id);
          return (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{getStatusBadge(template.status)}</TableCell>
              <TableCell>{template.questions.length}</TableCell>
              <TableCell>{templateAssignments.length} user(s)</TableCell>
              <TableCell>{getDueDateFormat(templateAssignments)}</TableCell>
              <TableCell>
                {new Date(template.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/assessment/${template.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AssessmentTemplatesTable;
