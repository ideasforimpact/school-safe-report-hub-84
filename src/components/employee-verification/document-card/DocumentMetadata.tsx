
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
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
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
      <div className="flex items-center mt-1 text-xs font-medium">
        {verificationMethod === 'api' ? (
          <div className="flex items-center text-blue-600">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            <span>Auto-verified</span>
          </div>
        ) : (
          <div className="flex items-center text-purple-600">
            <ShieldX className="h-3.5 w-3.5 mr-1" />
            <span>Manually verified</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col">
        <h3 className="text-lg font-medium">{getDocumentTypeLabel(documentType)}</h3>
        <p className="text-sm text-gray-500">
          {documentType === 'other' ? 
            (documentNumber || 'No reference number') : 
            `Document #${documentNumber}`}
        </p>
        {renderVerificationMethod()}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
          <span className="font-medium">Uploaded on:</span>{' '}
          <span className="text-gray-600">{formatDate(createdAt)}</span>
        </div>
        
        <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
          <span className="font-medium">Status:</span>{' '}
          {verificationStatus === 'pending' ? (
            <span className="text-yellow-600">Pending verification</span>
          ) : (
            <>
              <span className={verificationStatus === 'verified' ? 'text-green-600' : 'text-red-600'}>
                {verificationStatus === 'verified' ? 'Verified' : 'Failed'}
              </span> on {formatDate(verificationDate)}
            </>
          )}
        </div>
        
        {verificationNotes && (
          <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
            <span className="font-medium">Notes:</span>{' '}
            <span className="text-gray-600">{verificationNotes}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentMetadata;
