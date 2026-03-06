import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, FileX } from 'lucide-react';

interface VerificationStatusSummaryProps {
  summary: {
    verified: number;
    pending: number;
    inProgress?: number;
    failed: number;
    total: number;
  };
  className?: string;
}

const VerificationStatusSummary = ({ summary, className = '' }: VerificationStatusSummaryProps) => {
  const { verified, pending, inProgress, failed, total } = summary;

  if (total === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FileX className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary">No Documents</Badge>
      </div>
    );
  }

  // Priority-based status logic
  // Priority: Failed > In Progress > Pending > Verified
  // If ANY document failed → Show "Failed"
  // If no failures but ANY pending → Show "Pending"  
  // If ALL documents verified → Show "Verified"
  const getOverallStatus = () => {
    if (failed > 0) {
      return {
        status: 'Failed',
        icon: XCircle,
        iconColor: 'text-red-600',
        badgeClass: 'bg-red-100 text-red-800 border-red-200'
      };
    } else if (inProgress > 0) {
      return {
        status: 'In Progress',
        icon: Clock,
        iconColor: 'text-blue-600',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (pending > 0) {
      return {
        status: 'Pending',
        icon: Clock,
        iconColor: 'text-amber-600',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    } else {
      return {
        status: 'Verified',
        icon: CheckCircle,
        iconColor: 'text-emerald-600',
        badgeClass: 'bg-green-100 text-green-800 border-green-200'
      };
    }
  };

  const { status, icon: StatusIcon, iconColor, badgeClass } = getOverallStatus();

  // Debug log to check what's being rendered
  console.log('VerificationStatusSummary - Rendering status:', status, 'with icon:', StatusIcon.name);

  return (
    <div className={`flex items-center ${className}`}>
      <Badge className={`gap-1 px-2 py-1 font-medium text-xs ${badgeClass}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {status}
          </Badge>
    </div>
  );
};

export default VerificationStatusSummary;