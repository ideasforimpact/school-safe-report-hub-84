
import { Button, ButtonProps } from "@/components/ui/button";
import { ReactNode } from "react";

interface ActionButtonProps extends ButtonProps {
  icon?: ReactNode;
  children: ReactNode;
}

const ActionButton = ({ 
  icon, 
  children, 
  className, 
  ...props 
}: ActionButtonProps) => {
  return (
    <Button 
      size="sm" 
      className={className}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </Button>
  );
};

export default ActionButton;
