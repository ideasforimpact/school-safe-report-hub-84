
import jsPDF from 'jspdf';

interface BankStatementData {
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  bank_name?: string;
  branch?: string;
  account_type?: string;
  balance?: string;
  transactions?: Array<{
    date?: string;
    description?: string;
    amount?: string;
    type?: string;
    balance?: string;
  }>;
  statement_period?: {
    from?: string;
    to?: string;
  };
  [key: string]: any;
}

export const generateBankStatementPDF = (statementData: BankStatementData, documentNumber?: string) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string, index: number) => {
        checkPageBreak(fontSize * 0.5);
        pdf.text(line, x, y + (index * fontSize * 0.5));
      });
      return y + (lines.length * fontSize * 0.5);
    } else {
      checkPageBreak(fontSize * 0.5);
      pdf.text(text, x, y);
      return y + fontSize * 0.5;
    }
  };

  // Title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  yPosition = addText('Bank Statement', margin, yPosition + 10, undefined, 18);
  yPosition += 10;

  // Document number if available
  if (documentNumber) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    yPosition = addText(`Document: ${documentNumber}`, margin, yPosition + 5, undefined, 12);
    yPosition += 10;
  }

  // Account Information Section
  if (statementData.account_number || statementData.account_holder_name || statementData.bank_name) {
    checkPageBreak(60);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('Account Information', margin, yPosition + 10, undefined, 14);
    yPosition += 5;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');

    if (statementData.account_holder_name) {
      yPosition = addText(`Account Holder: ${statementData.account_holder_name}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.account_number) {
      yPosition = addText(`Account Number: ${statementData.account_number}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.bank_name) {
      yPosition = addText(`Bank Name: ${statementData.bank_name}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.branch) {
      yPosition = addText(`Branch: ${statementData.branch}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.ifsc_code) {
      yPosition = addText(`IFSC Code: ${statementData.ifsc_code}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.account_type) {
      yPosition = addText(`Account Type: ${statementData.account_type}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.balance) {
      yPosition = addText(`Current Balance: ${statementData.balance}`, margin, yPosition + 8, undefined, 10);
    }
    yPosition += 10;
  }

  // Statement Period
  if (statementData.statement_period) {
    checkPageBreak(30);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('Statement Period', margin, yPosition + 10, undefined, 14);
    yPosition += 5;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');

    if (statementData.statement_period.from) {
      yPosition = addText(`From: ${statementData.statement_period.from}`, margin, yPosition + 8, undefined, 10);
    }
    if (statementData.statement_period.to) {
      yPosition = addText(`To: ${statementData.statement_period.to}`, margin, yPosition + 8, undefined, 10);
    }
    yPosition += 10;
  }

  // Transactions Section
  if (statementData.transactions && statementData.transactions.length > 0) {
    checkPageBreak(50);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('Transaction History', margin, yPosition + 10, undefined, 14);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    const colWidths = [30, 80, 25, 20, 25];
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Balance'];
    
    let xPos = margin;
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 8;

    // Draw line under headers
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Transaction rows
    pdf.setFont(undefined, 'normal');
    statementData.transactions.forEach((transaction) => {
      checkPageBreak(15);
      
      xPos = margin;
      const values = [
        transaction.date || '',
        transaction.description || '',
        transaction.amount || '',
        transaction.type || '',
        transaction.balance || ''
      ];

      values.forEach((value, index) => {
        const truncatedValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
        pdf.text(truncatedValue, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 10;
    });
  }

  // Add other statement data if available
  const excludeKeys = ['account_number', 'ifsc_code', 'account_holder_name', 'bank_name', 'branch', 'account_type', 'balance', 'transactions', 'statement_period'];
  const otherData = Object.keys(statementData).filter(key => !excludeKeys.includes(key) && statementData[key]);
  
  if (otherData.length > 0) {
    checkPageBreak(50);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('Additional Information', margin, yPosition + 15, undefined, 14);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');

    otherData.forEach(key => {
      const value = typeof statementData[key] === 'object' ? JSON.stringify(statementData[key]) : String(statementData[key]);
      yPosition = addText(`${key.replace(/_/g, ' ').toUpperCase()}: ${value}`, margin, yPosition + 8, pageWidth - 2 * margin, 10);
    });
  }

  // Save the PDF
  const fileName = `bank-statement-${documentNumber || Date.now()}.pdf`;
  pdf.save(fileName);
};
