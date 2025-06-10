
import jsPDF from 'jspdf';

interface BankStatementData {
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  ifsc_code?: string;
  branch?: string;
  statement_period?: string;
  opening_balance?: number;
  closing_balance?: number;
  transactions?: Array<{
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    balance?: number;
  }>;
  [key: string]: any;
}

export const generateBankStatementPdf = (statementData: any, documentId: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  let currentY = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (currentY + requiredSpace > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with automatic line wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * lineHeight;
  };

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Statement', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Document ID
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document ID: ${documentId}`, margin, currentY);
  currentY += 10;

  // Generated date
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);
  currentY += 15;

  // Extract statement data
  const data: BankStatementData = statementData?.data || statementData || {};

  // Account Information Section
  checkPageBreak(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Information', margin, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const accountFields = [
    { label: 'Account Holder Name', value: data.account_holder_name },
    { label: 'Account Number', value: data.account_number },
    { label: 'Bank Name', value: data.bank_name },
    { label: 'IFSC Code', value: data.ifsc_code || data.ifsc_details?.ifsc },
    { label: 'Branch', value: data.branch || data.ifsc_details?.branch },
    { label: 'Statement Period', value: data.statement_period },
  ];

  accountFields.forEach(field => {
    if (field.value) {
      checkPageBreak();
      doc.setFont('helvetica', 'bold');
      doc.text(`${field.label}:`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(field.value), margin + 60, currentY);
      currentY += lineHeight;
    }
  });

  currentY += 10;

  // Balance Information
  if (data.opening_balance !== undefined || data.closing_balance !== undefined) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Information', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (data.opening_balance !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.text('Opening Balance:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`₹${Number(data.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 60, currentY);
      currentY += lineHeight;
    }

    if (data.closing_balance !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.text('Closing Balance:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`₹${Number(data.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 60, currentY);
      currentY += lineHeight;
    }

    currentY += 10;
  }

  // Transactions Table
  if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction History', margin, currentY);
    currentY += 15;

    // Table headers
    const tableStartY = currentY;
    const colWidths = [30, 80, 25, 25, 25];
    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let x = margin;
    headers.forEach((header, index) => {
      doc.text(header, x, currentY);
      x += colWidths[index];
    });
    
    // Draw header line
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
    currentY += 10;

    // Table rows
    doc.setFont('helvetica', 'normal');
    data.transactions.forEach((transaction, index) => {
      checkPageBreak(15);
      
      x = margin;
      const rowData = [
        transaction.date || '',
        transaction.description || '',
        transaction.debit ? `₹${Number(transaction.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '',
        transaction.credit ? `₹${Number(transaction.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '',
        transaction.balance ? `₹${Number(transaction.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''
      ];

      rowData.forEach((cell, cellIndex) => {
        if (cellIndex === 1) { // Description column - wrap text
          const lines = doc.splitTextToSize(cell, colWidths[cellIndex] - 2);
          doc.text(lines, x, currentY);
          if (lines.length > 1) {
            currentY += (lines.length - 1) * 5;
          }
        } else {
          doc.text(cell, x, currentY);
        }
        x += colWidths[cellIndex];
      });

      currentY += 8;

      // Add separator line every 5 transactions
      if ((index + 1) % 5 === 0) {
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;
      }
    });

    currentY += 10;
  }

  // Additional Information Section
  const additionalFields = Object.entries(data).filter(([key, value]) => 
    !['account_number', 'account_holder_name', 'bank_name', 'ifsc_code', 'branch', 
      'statement_period', 'opening_balance', 'closing_balance', 'transactions', 'ifsc_details'].includes(key) &&
    value !== null && value !== undefined && value !== ''
  );

  if (additionalFields.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Information', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    additionalFields.forEach(([key, value]) => {
      checkPageBreak();
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      
      let valueStr = '';
      if (typeof value === 'object') {
        valueStr = JSON.stringify(value, null, 2);
      } else {
        valueStr = String(value);
      }

      if (valueStr.length > 50) {
        const lines = doc.splitTextToSize(valueStr, pageWidth - margin - 70);
        doc.text(lines, margin + 60, currentY);
        currentY += lines.length * lineHeight - lineHeight;
      } else {
        doc.text(valueStr, margin + 60, currentY);
      }
      currentY += lineHeight;
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages} | Generated on ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'This is a system-generated document',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Generate filename and download
  const filename = `bank_statement_${data.account_number || documentId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
