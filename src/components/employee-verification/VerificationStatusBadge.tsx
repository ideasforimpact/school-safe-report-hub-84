
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, Clock, Info } from "lucide-react";

type Status = 'pending' | 'verified' | 'failed';

interface VerificationStatusBadgeProps {
  status: Status;
  isGovernance?: boolean;
  isManual?: boolean;
  documentStatusName?: string; 
  onClick?: () => void;
}

const VerificationStatusBadge = ({ 
  status,
  isGovernance = false,
  isManual = false,
  documentStatusName,
  onClick
}: VerificationStatusBadgeProps) => {
  if (status === 'verified') {
    const isClickable = typeof onClick === 'function';
    
    if (isGovernance) {
      const BadgeComponent = isClickable ? Button : Badge;
      
      return (
        <BadgeComponent
          variant={isClickable ? "ghost" : "outline"}
          size={isClickable ? "sm" : undefined}
          className={`
            bg-green-50 hover:bg-green-100 text-green-700 border-green-200
            ${isClickable ? 'cursor-pointer px-2 py-1' : ''}
          `}
          onClick={onClick}
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
          Verified (Governance)
        </BadgeComponent>
      );
    } 
    
    if (isManual) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 hover:bg-purple-50 text-purple-700 border-purple-200"
        >
          <Info className="h-3.5 w-3.5 mr-1" />
          Manually Verified
        </Badge>
      );
    }
    
    if (documentStatusName) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 hover:bg-green-50 text-green-700 border-green-200"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
          Verified ({documentStatusName})
        </Badge>
      );
    }
    
    return (
      <Badge
        variant="outline"
        className="bg-green-50 hover:bg-green-50 text-green-700 border-green-200"
      >
        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        Verified
      </Badge>
    );
  }
  
  if (status === 'failed') {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 hover:bg-red-50 text-red-700 border-red-200"
      >
        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        Failed
      </Badge>
    );
  }
  
  // Default is 'pending'
  return (
    <Badge
      variant="outline"
      className="bg-yellow-50 hover:bg-yellow-50 text-yellow-700 border-yellow-200"
    >
      <Clock className="h-3.5 w-3.5 mr-1" />
      Pending
    </Badge>
  );
};

export default VerificationStatusBadge;
