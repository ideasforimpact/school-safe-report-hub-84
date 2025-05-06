
import { Table, TableBody } from "@/components/ui/table";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useAssessments } from "@/hooks/useAssessments";
import { useToast } from "@/components/ui/use-toast";
import TemplateTableHeader from "./table/TemplateTableHeader";
import TemplateTableRow from "./table/TemplateTableRow";

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
  const { getAssignmentsByTemplate, updateTemplateStatus, assignTemplate } = useAssessments();
  const { toast } = useToast();

  const handleActivate = (templateId: string) => {
    updateTemplateStatus(templateId, 'active');
    toast({
      title: "Template activated",
      description: "The template has been activated successfully."
    });
  };
  
  const handleAssign = (templateId: string, userIds: string[], dueDate?: Date) => {
    assignTemplate(templateId, userIds, dueDate);
    
    const template = templates.find(t => t.id === templateId);
    const templateName = template ? template.name : 'Template';
    
    toast({
      title: "Template assigned",
      description: `${templateName} assigned to ${userIds.length} user(s).`
    });
  };

  return (
    <Table>
      <TemplateTableHeader 
        sortField={sortField} 
        sortDirection={sortDirection} 
        onSort={onSort} 
      />
      <TableBody>
        {templates.map((template) => {
          const templateAssignments = getAssignmentsByTemplate(template.id);
          
          return (
            <TemplateTableRow
              key={template.id}
              template={template}
              assignments={templateAssignments}
              onAssign={handleAssign}
              onActivate={handleActivate}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AssessmentTemplatesTable;
