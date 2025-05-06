
import { Edit } from "lucide-react";
import ActionButton from "./ActionButton";
import { useNavigate } from "react-router-dom";

interface EditButtonProps {
  onClick?: () => void;  // Make onClick optional
  isComplete: boolean;
  templateId: string;
}

const EditButton = ({ onClick, isComplete, templateId }: EditButtonProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // If using provided onClick, use it, otherwise navigate directly
    if (onClick) {
      onClick();
    } else {
      console.log(`Navigating to template: /assessment/${templateId}`);
      navigate(`/assessment/${templateId}`);
    }
  };
  
  return (
    <ActionButton 
      variant={isComplete ? "outline" : "default"}
      onClick={handleClick}
      icon={isComplete ? <Edit className="h-4 w-4" /> : undefined}
    >
      {isComplete ? "Edit" : "Add Questions"}
    </ActionButton>
  );
};

export default EditButton;
