
import React from 'react';
import { format } from 'date-fns';
import { ShieldCheck, ShieldX } from 'lucide-react';

interface DocumentMetadataProps {
  documentType: string;
  documentNumber?: string;
  createdAt: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDate?: string;
  verificationNotes?: string;
  verificationMethod?: 'api' | 'manual';
}

const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  documentType,
  documentNumber,
  createdAt,
  verificationStatus,
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

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'aadhar': return 'Aadhar Card';
      case 'pan': return 'PAN Card';
      case 'driving_license': return 'Driving License';
      case 'passport': return 'Passport';
      case 'bank_account': return 'Bank Account';
      case 'voter_id': return 'Voter ID';
      case 'other': return 'Other Document';
      default: return type;
    }
  };

  // Render verification method icon/badge
  const renderVerificationMethod = () => {
    if (verificationStatus !== 'verified' || !verificationMethod) {
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

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-lg font-medium">{getDocumentTypeLabel(documentType)}</h3>
        <p className="text-sm text-gray-500">
          {documentType === 'other' ? 
            (documentNumber || 'No reference number') : 
            `#${documentNumber || 'N/A'}`}
        </p>
        {renderVerificationMethod()}
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
          <span className="text-gray-600">Uploaded: {formatDate(createdAt)}</span>
        </div>
        
        <div className={`px-2 py-1 rounded-md ${
          verificationStatus === 'pending' ? 'bg-yellow-50 border border-yellow-100' : 
          verificationStatus === 'verified' ? 'bg-green-50 border border-green-100' : 
          'bg-red-50 border border-red-100'
        }`}>
          <span className={
            verificationStatus === 'pending' ? 'text-yellow-600' : 
            verificationStatus === 'verified' ? 'text-green-600' : 
            'text-red-600'
          }>
            {verificationStatus === 'pending' ? 'Pending' : 
             verificationStatus === 'verified' ? `Verified ${formatDate(verificationDate)}` : 
             `Failed ${formatDate(verificationDate)}`}
          </span>
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
