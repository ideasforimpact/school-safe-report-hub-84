import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileX } from 'lucide-react';
import { getOverallVerificationStatus } from './utils/verificationStatusPriority';

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

  // Precedence order lives in VERIFICATION_STATUS_PRIORITY (utils/verificationStatusPriority.ts) —
  // reorder that list to change which status wins when multiple conditions are true at once.
  const { status, icon: StatusIcon, iconColor, badgeClass } = getOverallVerificationStatus({
    verified,
    pending,
    inProgress,
    failed,
    total,
  });

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