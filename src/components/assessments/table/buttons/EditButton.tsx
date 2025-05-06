
import { Edit } from "lucide-react";
import ActionButton from "./ActionButton";

interface EditButtonProps {
  onClick: () => void;
  isComplete: boolean;
}

const EditButton = ({ onClick, isComplete }: EditButtonProps) => {
  return (
    <ActionButton 
      variant={isComplete ? "outline" : "default"}
      onClick={onClick}
      icon={isComplete ? <Edit className="h-4 w-4" /> : undefined}
    >
      {isComplete ? "Edit" : "Add Questions"}
    </ActionButton>
  );
};

export default EditButton;
