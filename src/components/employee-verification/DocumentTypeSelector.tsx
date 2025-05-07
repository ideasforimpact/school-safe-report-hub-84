
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
  bgColor: string;
};

const documentTypes: DocumentTypeOption[] = [
  { value: 'aadhar', label: 'Aadhar', icon: CreditCard, bgColor: 'bg-blue-50' },
  { value: 'pan', label: 'PAN', icon: FileText, bgColor: 'bg-yellow-50' },
  { value: 'bank_account', label: 'Bank', icon: Building, bgColor: 'bg-green-50' },
  { value: 'driving_license', label: 'License', icon: Car, bgColor: 'bg-purple-50' },
  { value: 'passport', label: 'Passport', icon: Globe, bgColor: 'bg-cyan-50' },
  { value: 'voter_id', label: 'Voter ID', icon: Users, bgColor: 'bg-pink-50' },
  { value: 'other', label: 'Other', icon: Wallet, bgColor: 'bg-orange-50' },
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
                ? `${type.bgColor} border-primary text-primary` 
                : `${type.bgColor} border-transparent hover:border-gray-300`
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
