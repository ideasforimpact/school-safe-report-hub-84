
import { useState } from "react";
import { Users } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ActionButton from "./ActionButton";
import InlineAssignTemplate from "../../InlineAssignTemplate";

interface AssignButtonProps {
  templateId: string;
  templateName: string;
  onAssign: (userIds: string[], dueDate?: Date) => void;
}

const AssignButton = ({ templateId, templateName, onAssign }: AssignButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = (userIds: string[], dueDate?: Date) => {
    onAssign(userIds, dueDate);
    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <ActionButton 
                variant="outline"
                icon={<Users className="h-4 w-4" />}
                onClick={() => setIsOpen(true)}
              >
                Assign
              </ActionButton>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <InlineAssignTemplate
                templateId={templateId}
                templateName={templateName}
                onAssign={handleAssign}
                onClose={() => setIsOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          Assign to users
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AssignButton;
