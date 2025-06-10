
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { generateBankStatementPDF } from '@/utils/bankStatementPdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface BankStatementDownloadIconProps {
  document: VerificationDocument;
}

const BankStatementDownloadIcon: React.FC<BankStatementDownloadIconProps> = ({ document }) => {
  const { toast } = useToast();

  // Check if document meets the conditions
  const shouldShowIcon = () => {
    // Check if it's a bank account document
    if (document.documentTypeName !== 'bank_account') {
      return false;
    }

    // Check if status is verified with governance
    if (document.verificationStatus !== 'verified' || document.documentStatusName !== 'governance') {
      return false;
    }

    // Check if cron_log contains cron_bank_statement_download action
    if (!document.cronLog || document.cronLog.length === 0) {
      return false;
    }

    const hasBankStatementDownload = document.cronLog.some(log => 
      log.action === 'cron_bank_statement_download'
    );

    return hasBankStatementDownload;
  };

  const handleDownload = () => {
    try {
      // Find the bank statement download log
      const bankStatementLog = document.cronLog?.find(log => 
        log.action === 'cron_bank_statement_download'
      );

      if (!bankStatementLog || !bankStatementLog.details) {
        toast({
          title: "Error",
          description: "No bank statement data found in the log.",
          variant: "destructive",
        });
        return;
      }

      // Extract statement data from the log details
      const statementData = bankStatementLog.details;
      
      // Generate and download the PDF
      generateBankStatementPDF(statementData, document.documentNumber);

      toast({
        title: "Success",
        description: "Bank statement PDF downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating bank statement PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate bank statement PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!shouldShowIcon()) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download Bank Statement PDF</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BankStatementDownloadIcon;
