
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AssignButton from "./buttons/AssignButton";
import ActivateButton from "./buttons/ActivateButton";
import EditButton from "./buttons/EditButton";

interface TemplateTableActionsProps {
  template: AssessmentTemplate;
  onAssign: (templateId: string, userIds: string[], dueDate?: Date) => void;
  onActivate: (templateId: string) => void;
}

const TemplateTableActions = ({ template, onAssign, onActivate }: TemplateTableActionsProps) => {
  const navigate = useNavigate();
  const [assigningTemplateId, setAssigningTemplateId] = useState<string | null>(null);
  
  const isComplete = template.questions.length > 0;
  const isActive = template.status === 'active';

  const handleAssign = (userIds: string[], dueDate?: Date) => {
    onAssign(template.id, userIds, dueDate);
    setAssigningTemplateId(null);
  };

  const handleEditClick = () => navigate(`/assessment/${template.id}`);
  
  const handleActivateClick = () => onActivate(template.id);

  return (
    <div className="flex justify-end space-x-2">
      {isComplete && (
        <AssignButton 
          templateId={template.id} 
          templateName={template.name}
          onAssign={handleAssign}
        />
      )}
      
      {isComplete && !isActive && (
        <ActivateButton onActivate={handleActivateClick} />
      )}
      
      <EditButton 
        isComplete={isComplete}
        onClick={handleEditClick}
        templateId={template.id}
      />
    </div>
  );
};

export default TemplateTableActions;
