
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';
import { generateBankStatementPdf } from '@/utils/bankStatementPdfGenerator';
import { toast } from 'sonner';

interface BankStatementDownloadButtonProps {
  documentId: string;
  cronLog: Array<{
    timestamp: string;
    action: string;
    response?: any;
    details?: any;
  }>;
  verificationStatus: string;
  documentStatusName?: string;
  documentType?: string;
}

const BankStatementDownloadButton: React.FC<BankStatementDownloadButtonProps> = ({
  documentId,
  cronLog,
  verificationStatus,
  documentStatusName,
  documentType
}) => {
  // Check if this document qualifies for download
  const isQualified = () => {
    // Must be verified with governance status
    if (verificationStatus !== 'verified' || documentStatusName !== 'governance') {
      return false;
    }

    // Must be a bank account document
    if (!documentType?.toLowerCase().includes('bank')) {
      return false;
    }

    // Must have a cron log entry with the specific action
    return cronLog?.some(log => log.action === 'cron_bank_statement_download');
  };

  const handleDownload = () => {
    try {
      // Find the bank statement download log entry
      const bankStatementLog = cronLog?.find(log => log.action === 'cron_bank_statement_download');
      
      if (!bankStatementLog) {
        toast.error('Bank statement data not found in verification logs');
        return;
      }

      // Extract statement data from the log
      const statementData = bankStatementLog.response || bankStatementLog.details;
      
      if (!statementData) {
        toast.error('No statement data available for download');
        return;
      }

      console.log('Generating PDF for bank statement:', statementData);
      
      // Generate and download the PDF
      generateBankStatementPdf(statementData, documentId);
      
      toast.success('Bank statement PDF generated successfully');
    } catch (error) {
      console.error('Error generating bank statement PDF:', error);
      toast.error('Failed to generate bank statement PDF');
    }
  };

  // Only render if the document qualifies
  if (!isQualified()) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download Bank Statement PDF</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BankStatementDownloadButton;
