
import { TableCell, TableRow } from "@/components/ui/table";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import StatusBadge from "./StatusBadge";
import CompletionBadge from "./CompletionBadge";
import TemplateTableActions from "./TemplateTableActions";
import DueDateFormatter from "./DueDateFormatter";

interface TemplateTableRowProps {
  template: AssessmentTemplate;
  assignments: any[];
  onAssign: (templateId: string, userIds: string[], dueDate?: Date) => void;
  onActivate: (templateId: string) => void;
}

const TemplateTableRow = ({ template, assignments, onAssign, onActivate }: TemplateTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{template.name}</TableCell>
      <TableCell><StatusBadge status={template.status} /></TableCell>
      <TableCell><CompletionBadge template={template} /></TableCell>
      <TableCell>{template.questions.length}</TableCell>
      <TableCell>{assignments.length} user(s)</TableCell>
      <TableCell><DueDateFormatter assignments={assignments} /></TableCell>
      <TableCell>
        {new Date(template.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <TemplateTableActions 
          template={template} 
          onAssign={onAssign} 
          onActivate={onActivate} 
        />
      </TableCell>
    </TableRow>
  );
};

export default TemplateTableRow;
