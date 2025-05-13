
import React from 'react';
import { VehicleDocument } from '@/types/transportSafety';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentStatusSummaryProps {
  documents: VehicleDocument[];
}

const DocumentStatusSummary: React.FC<DocumentStatusSummaryProps> = ({ documents }) => {
  const expired = documents.filter(doc => doc.status === 'expired').length;
  const expiringSoon = documents.filter(doc => doc.status === 'expiring_soon').length;
  const valid = documents.filter(doc => doc.status === 'valid').length;
  const total = documents.length;

  return (
    <div className="flex items-center text-sm">
      {expired > 0 ? (
        <div className="flex items-center text-red-600 mr-4">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{expired} expired</span>
        </div>
      ) : null}
      
      {expiringSoon > 0 ? (
        <div className="flex items-center text-yellow-600 mr-4">
          <Clock className="h-4 w-4 mr-1" />
          <span>{expiringSoon} expiring soon</span>
        </div>
      ) : null}
      
      <div className={cn(
        "flex items-center",
        expired > 0 ? "text-red-600" : expiringSoon > 0 ? "text-yellow-600" : "text-green-600"
      )}>
        <CheckCircle className="h-4 w-4 mr-1" />
        <span>{valid} valid</span>
      </div>
      
      <div className="ml-auto text-gray-500">
        {total} document{total !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default DocumentStatusSummary;
