
import React from 'react';
import { Check, CreditCard, FileText, Fingerprint, Wallet, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationDocumentType } from '@/types/employeeVerification';

interface DocumentTypeOption {
  id: VerificationDocumentType;
  name: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
}

const documentTypes: DocumentTypeOption[] = [
  {
    id: 'aadhar',
    name: 'Aadhar Card',
    description: 'Government issued 12-digit Unique Identity Number',
    icon: Fingerprint,
    bgColor: 'from-blue-50 to-blue-100',
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'Permanent Account Number for tax identification',
    icon: FileText,
    bgColor: 'from-amber-50 to-amber-100',
  },
  {
    id: 'driving_license',
    name: 'Driving License',
    description: 'Official document permitting a person to drive',
    icon: CreditCard,
    bgColor: 'from-green-50 to-green-100',
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'Official travel document issued by a government',
    icon: FileText,
    bgColor: 'from-purple-50 to-purple-100',
  },
  {
    id: 'voter_id',
    name: 'Voter ID',
    description: 'Electoral photo identity card issued by Election Commission',
    icon: FileText,
    bgColor: 'from-pink-50 to-pink-100',
  },
  {
    id: 'bank_account',
    name: 'Bank Account',
    description: 'Verify bank account details for salary transfers',
    icon: Wallet,
    bgColor: 'from-teal-50 to-teal-100',
  },
  {
    id: 'other',
    name: 'Other Documents',
    description: 'Upload additional documents like Salary Slip, CV, etc.',
    icon: File,
    bgColor: 'from-gray-50 to-gray-100',
  },
];

interface DocumentTypeSelectorProps {
  selectedType: VerificationDocumentType | null;
  onChange: (type: VerificationDocumentType) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selectedType, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {documentTypes.map((docType) => {
        const isSelected = selectedType === docType.id;
        const Icon = docType.icon;
        
        return (
          <button
            key={docType.id}
            type="button"
            onClick={() => onChange(docType.id)}
            className={cn(
              "relative flex flex-col items-start p-5 border rounded-lg transition-all bg-gradient-to-br hover:shadow-md transform hover:-translate-y-1 hover:scale-[1.02]",
              isSelected
                ? `border-primary bg-primary/5 ring-2 ring-primary shadow-md`
                : `border-gray-200 ${docType.bgColor}`
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 h-5 w-5 text-primary">
                <Check className="h-5 w-5" />
              </div>
            )}
            <div className={cn(
              "p-3 rounded-full mb-3 transition-colors", 
              isSelected ? "bg-primary/20 text-primary" : "bg-white/60 text-gray-700"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-left text-base font-medium">{docType.name}</h3>
            <p className="text-left text-sm text-gray-600 mt-1">{docType.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default DocumentTypeSelector;
