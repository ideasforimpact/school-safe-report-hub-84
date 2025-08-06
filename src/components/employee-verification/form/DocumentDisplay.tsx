import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentDisplayProps {
  documentType: string;
  documentNumber?: string;
  documentImage?: string;
  fileName?: string;
  params?: any;
}

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({
  documentType,
  documentNumber,
  documentImage,
  fileName,
  params
}) => {
  // Helper function to get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'aadhar': 'Aadhar Card',
      'pan': 'PAN Card',
      'voter_id': 'Voter ID',
      'driving_license': 'Driving License',
      'bank_account': 'Bank Account',
      'other': 'Other Document'
    };
    return labels[type] || type.replace('_', ' ').toUpperCase();
  };

  // Helper function to extract filename from storage path or create a friendly name
  const getDisplayFileName = () => {
    if (fileName) {
      // Extract filename from path if it contains /
      const parts = fileName.split('/');
      return parts[parts.length - 1];
    }
    
    // Create a friendly filename based on document type
    const typeLabel = getDocumentTypeLabel(documentType).replace(/\s+/g, '_');
    return `${typeLabel}_Document.jpg`;
  };

  // Helper function to format additional details
  const getAdditionalDetails = () => {
    const details: string[] = [];
    
    if (documentType === 'bank_account' && params) {
      if (params.accountNumber) details.push(`Account: ${params.accountNumber}`);
      if (params.ifscCode) details.push(`IFSC: ${params.ifscCode}`);
    }
    
    if (documentType === 'driving_license' && params?.DOB) {
      details.push(`DOB: ${new Date(params.DOB).toLocaleDateString()}`);
    }
    
    return details;
  };

  const additionalDetails = getAdditionalDetails();

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                {getDocumentTypeLabel(documentType)}
              </h3>
              <p className="text-sm text-green-600">Document already uploaded</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        </div>

        <div className="space-y-3">
          {documentNumber && (
            <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border">
              <span className="text-sm font-medium text-gray-600">Document Number:</span>
              <span className="text-sm font-mono text-gray-900">{documentNumber}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border">
            <span className="text-sm font-medium text-gray-600">File Name:</span>
            <span className="text-sm text-gray-900 truncate max-w-xs" title={getDisplayFileName()}>
              {getDisplayFileName()}
            </span>
          </div>

          {additionalDetails.map((detail, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-md border">
              <span className="text-sm font-medium text-gray-600">{detail.split(':')[0]}:</span>
              <span className="text-sm font-mono text-gray-900">{detail.split(':')[1].trim()}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-100 rounded-md">
          <p className="text-sm text-green-700">
            This document has already been uploaded for verification. 
            To upload a new document, please delete the existing one first from the employee verification page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentDisplay;