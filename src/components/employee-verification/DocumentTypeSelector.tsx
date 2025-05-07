
import React from 'react';
import { VerificationDocumentType } from '@/types/employeeVerification';
import { 
  CreditCard, 
  FileText, 
  Wallet, 
  Car, 
  Globe, 
  Building, 
  Users 
} from 'lucide-react';

interface DocumentTypeSelectorProps {
  selectedType: VerificationDocumentType | null;
  onChange: (type: VerificationDocumentType) => void;
}

type DocumentTypeOption = {
  value: VerificationDocumentType;
  label: string;
  icon: React.ElementType;
};

const documentTypes: DocumentTypeOption[] = [
  { value: 'aadhar', label: 'Aadhar', icon: CreditCard },
  { value: 'pan', label: 'PAN', icon: FileText },
  { value: 'bank_account', label: 'Bank', icon: Building },
  { value: 'driving_license', label: 'License', icon: Car },
  { value: 'passport', label: 'Passport', icon: Globe },
  { value: 'voter_id', label: 'Voter ID', icon: Users },
  { value: 'other', label: 'Other', icon: Wallet },
];

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selectedType, onChange }) => {
  return (
    <div className="grid grid-cols-7 gap-2 w-full">
      {documentTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.value;
        
        return (
          <div
            key={type.value}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border transition-colors
              ${isSelected 
                ? 'border-primary bg-primary-50 text-primary' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onChange(type.value)}
          >
            <Icon className={`h-6 w-6 mb-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
            <span className="text-xs font-medium">{type.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentTypeSelector;
