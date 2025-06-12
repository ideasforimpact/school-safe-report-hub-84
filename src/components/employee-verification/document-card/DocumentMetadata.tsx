
import React from 'react';
import { format } from 'date-fns';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { getDocumentTypeLabel, getStatusDisplayName } from '../utils/documentUtils';

interface DocumentMetadataProps {
  documentTypeName: string;
  documentNumber?: string;
  createdAt: string;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'in-progress' | 'completed';
  documentStatusName?: string;
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
}

const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  documentTypeName,
  documentNumber,
  createdAt,
  verificationStatus,
  documentStatusName,
  verificationDate,
  verificationNotes,
  verificationMethod,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not verified yet';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Render verification method icon/badge
  const renderVerificationMethod = () => {
    if ((verificationStatus !== 'verified' && verificationStatus !== 'completed') || !verificationMethod) {
      return null;
    }

    return (
      <div className="inline-flex items-center mt-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50">
        {verificationMethod === 'api' ? (
          <div className="flex items-center text-blue-600">
            <ShieldCheck className="h-3 w-3 mr-1" />
            <span>Auto-verified</span>
          </div>
        ) : (
          <div className="flex items-center text-purple-600">
            <ShieldX className="h-3 w-3 mr-1" />
            <span>Manual</span>
          </div>
        )}
      </div>
    );
  };

  // Show document status name if available
  const displayStatus = documentStatusName ? getStatusDisplayName(documentStatusName) : verificationStatus;

  // Get appropriate styling based on status
  const getStatusStyling = () => {
    switch (verificationStatus) {
      case 'pending':
        return 'bg-yellow-50 border border-yellow-100 text-yellow-600';
      case 'verified':
      case 'completed':
        return 'bg-green-50 border border-green-100 text-green-600';
      case 'in-progress':
        return 'bg-blue-50 border border-blue-100 text-blue-600';
      case 'failed':
        return 'bg-red-50 border border-red-100 text-red-600';
      default:
        return 'bg-gray-50 border border-gray-100 text-gray-600';
    }
  };

  // Get status display text
  const getStatusText = () => {
    switch (verificationStatus) {
      case 'pending':
        return 'Pending';
      case 'verified':
      case 'completed':
        return `${displayStatus} ${formatDate(verificationDate)}`;
      case 'in-progress':
        return 'In Progress';
      case 'failed':
        return `${displayStatus} ${formatDate(verificationDate)}`;
      default:
        return verificationStatus;
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-lg font-medium">{getDocumentTypeLabel(documentTypeName)}</h3>
        <p className="text-sm text-gray-500">
          {documentTypeName === 'other' ? 
            (documentNumber || 'No reference number') : 
            documentNumber ? `#${documentNumber}` : 'No reference number'}
        </p>
        {renderVerificationMethod()}
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
          <span className="text-gray-600">Uploaded: {formatDate(createdAt)}</span>
        </div>
        
        <div className={`px-2 py-1 rounded-md ${getStatusStyling()}`}>
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      {verificationNotes && (
        <div className="text-xs italic text-gray-500 border-l-2 border-gray-200 pl-2">
          "{verificationNotes}"
        </div>
      )}
    </div>
  );
};

export default DocumentMetadata;
