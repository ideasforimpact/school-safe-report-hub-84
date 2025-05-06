
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAssignmentSection from "./template-form/UserAssignmentSection";
import { useToast } from "@/components/ui/use-toast";

interface InlineAssignTemplateProps {
  templateId: string;
  templateName: string;
  onAssign: (userIds: string[], dueDate?: Date) => void;
  onClose: () => void;
}

const InlineAssignTemplate = ({
  templateId,
  templateName,
  onAssign,
  onClose
}: InlineAssignTemplateProps) => {
  const { users } = useAuth();
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const handleAssign = () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to assign this template to.",
        variant: "destructive"
      });
      return;
    }

    // Pass the Date object directly without any conversion
    onAssign(selectedUserIds, dueDate);
    onClose();
  };

  return (
    <div className="p-4 space-y-4 min-w-[350px]">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Assign Template</h4>
        <p className="text-xs text-muted-foreground">{templateName}</p>
      </div>
      
      <UserAssignmentSection
        users={users}
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Due Date (Optional)</label>
        <DatePicker date={dueDate} onChange={setDueDate} />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleAssign}>Assign</Button>
      </div>
    </div>
  );
};

export default InlineAssignTemplate;
