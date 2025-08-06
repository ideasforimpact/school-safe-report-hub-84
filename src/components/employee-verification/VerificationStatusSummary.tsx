import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, FileX } from 'lucide-react';

interface VerificationStatusSummaryProps {
  summary: {
    verified: number;
    pending: number;
    failed: number;
    total: number;
  };
  className?: string;
}

const VerificationStatusSummary = ({ summary, className = '' }: VerificationStatusSummaryProps) => {
  const { verified, pending, failed, total } = summary;

  if (total === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FileX className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary">No Documents</Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {verified > 0 && (
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-emerald-600" />
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5">
            {verified} Verified
          </Badge>
        </div>
      )}
      
      {pending > 0 && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-600" />
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5">
            {pending} Pending
          </Badge>
        </div>
      )}
      
      {failed > 0 && (
        <div className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-600" />
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-0.5">
            {failed} Failed
          </Badge>
        </div>
      )}

      {/* Show status separators only when there are multiple statuses */}
      {[verified > 0, pending > 0, failed > 0].filter(Boolean).length > 1 && (
        <span className="text-muted-foreground text-xs">|</span>
      )}
    </div>
  );
};

export default VerificationStatusSummary;