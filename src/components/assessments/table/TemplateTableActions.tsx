
import { Button } from "@/components/ui/button";
import { Edit, Play, Users } from "lucide-react";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import InlineAssignTemplate from "../InlineAssignTemplate";
import { useState } from "react";

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

  return (
    <div className="flex justify-end space-x-2">
      {isComplete && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover open={assigningTemplateId === template.id} onOpenChange={(open) => {
                if (!open) setAssigningTemplateId(null);
              }}>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setAssigningTemplateId(template.id)}
                  >
                    <Users className="h-4 w-4" />
                    Assign
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="end">
                  <InlineAssignTemplate
                    templateId={template.id}
                    templateName={template.name}
                    onAssign={handleAssign}
                    onClose={() => setAssigningTemplateId(null)}
                  />
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>
              Assign to users
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isComplete && !isActive && (
        <Button 
          size="sm" 
          className="bg-green-500 hover:bg-green-600"
          onClick={() => onActivate(template.id)}
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
  );
};

export default TemplateTableActions;
