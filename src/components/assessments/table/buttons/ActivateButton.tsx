
import { Play } from "lucide-react";
import ActionButton from "./ActionButton";

interface ActivateButtonProps {
  onActivate: () => void;
}

const ActivateButton = ({ onActivate }: ActivateButtonProps) => {
  return (
    <ActionButton 
      className="bg-green-500 hover:bg-green-600"
      icon={<Play className="h-4 w-4" />}
      onClick={onActivate}
    >
      Activate
    </ActionButton>
  );
};

export default ActivateButton;
