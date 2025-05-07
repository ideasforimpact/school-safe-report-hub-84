
import React from 'react';
import { Check, CreditCard, FileText, Fingerprint, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationDocumentType } from '@/types/employeeVerification';

interface DocumentTypeOption {
  id: VerificationDocumentType;
  name: string;
  description: string;
  icon: React.ElementType;
}

const documentTypes: DocumentTypeOption[] = [
  {
    id: 'aadhar',
    name: 'Aadhar Card',
    description: 'Government issued 12-digit Unique Identity Number',
    icon: Fingerprint,
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'Permanent Account Number for tax identification',
    icon: FileText,
  },
  {
    id: 'driving_license',
    name: 'Driving License',
    description: 'Official document permitting a person to drive',
    icon: CreditCard,
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'Official travel document issued by a government',
    icon: FileText, // Using FileText for Passport
  },
  {
    id: 'voter_id',
    name: 'Voter ID',
    description: 'Electoral photo identity card issued by Election Commission',
    icon: FileText, // Using FileText for Voter ID
  },
  {
    id: 'bank_account',
    name: 'Bank Account',
    description: 'Verify bank account details for salary transfers',
    icon: Wallet,
  },
];

interface DocumentTypeSelectorProps {
  selectedType: VerificationDocumentType | null;
  onChange: (type: VerificationDocumentType) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selectedType, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documentTypes.map((docType) => {
        const isSelected = selectedType === docType.id;
        const Icon = docType.icon;
        
        return (
          <button
            key={docType.id}
            type="button"
            onClick={() => onChange(docType.id)}
            className={cn(
              "relative flex flex-col items-start p-4 border rounded-md transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 h-4 w-4 text-primary">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className={cn("p-2 rounded-full mb-3", isSelected ? "bg-primary/10" : "bg-gray-100")}>
              <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-gray-600")} />
            </div>
            <h3 className="text-sm font-medium">{docType.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{docType.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default DocumentTypeSelector;
