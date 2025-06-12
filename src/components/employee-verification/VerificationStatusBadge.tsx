import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationStatusBadgeProps {
  status: 'pending' | 'verified' | 'failed' | 'in-progress';
  documentStatusName?: string;
  documentLogs?: Array<{
    timestamp: string;
    action: string;
    response: any;
    notes?: string;
  }>;
  documentId: string;
  documentType?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  documentStatusName, 
  documentLogs = [],
  documentId,
  documentType
}) => {
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Verified'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          className: '',
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: 'Failed'
        };
      case 'in-progress':
        return {
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600',
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'In Progress'
        };
      case 'pending':
      default:
        return {
          variant: 'outline' as const,
          className: 'border-yellow-500 text-yellow-700',
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant} 
        className={`${config.className} text-white flex items-center`}
      >
        {config.icon}
        {config.label}
      </Badge>
      
      {documentLogs.length > 0 && (
        <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Verification Logs - {documentType || 'Document'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {documentLogs.map((log, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{log.action}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-gray-600 mb-2">{log.notes}</p>
                    )}
                    {log.response && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VerificationStatusBadge;
