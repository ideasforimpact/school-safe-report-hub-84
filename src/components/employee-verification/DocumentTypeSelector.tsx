
import React from 'react';
import { 
  CreditCard, 
  FileText, 
  Wallet, 
  Car, 
  Globe2 as Globe, 
  Building, 
  Users 
} from 'lucide-react';
import { DocumentType } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';

interface DocumentTypeSelectorProps {
  selectedTypeId: string | null;
  onChange: (typeId: string) => void;
}

// Ordered document types as specified
const defaultDocumentTypes = [
  { id: '1', name: 'aadhar', description: 'Aadhar Card', icon: CreditCard, bgColor: 'bg-blue-50', enabled: true },
  { id: '2', name: 'pan', description: 'PAN Card', icon: FileText, bgColor: 'bg-yellow-50', enabled: true },
  { id: '6', name: 'voter_id', description: 'Voter ID', icon: Users, bgColor: 'bg-pink-50', enabled: true },
  { id: '4', name: 'driving_license', description: 'Driving License', icon: Car, bgColor: 'bg-purple-50', enabled: true },
  { id: '3', name: 'bank_account', description: 'Bank Account', icon: Building, bgColor: 'bg-green-50', enabled: true },
  { id: '5', name: 'passport', description: 'Passport', icon: Globe, bgColor: 'bg-cyan-50', enabled: false },
  { id: '7', name: 'other', description: 'Other', icon: Wallet, bgColor: 'bg-orange-50', enabled: true },
];

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selectedTypeId, onChange }) => {
  const { documentTypes, isLoading } = useEmployeeVerification();
  
  // No API calls here - the parent component handles fetching
  
  // Use fetched document types, or fall back to default if still loading
  const typesToDisplay = documentTypes.length > 0 ? 
    // Sort according to the specified order if we have API data and filter enabled types
    [...documentTypes]
      .filter(type => type.name !== 'passport') // Hide passport for now
      .sort((a, b) => {
        const orderMap: Record<string, number> = {
          'aadhar': 1,
          'pan': 2,
          'voter_id': 3,
          'driving_license': 4,
          'bank_account': 5,
          'passport': 6,
          'other': 7
        };
        return (orderMap[a.name] || 99) - (orderMap[b.name] || 99);
      }) : 
    // Filter enabled types from default types
    defaultDocumentTypes.filter(type => type.enabled);
  
  // Helper function to get icon for document type
  const getIconForType = (typeName: string) => {
    switch (typeName) {
      case 'aadhar': return CreditCard;
      case 'pan': return FileText;
      case 'bank_account': return Building;
      case 'driving_license': return Car;
      case 'passport': return Globe;
      case 'voter_id': return Users;
      case 'other': default: return Wallet;
    }
  };
  
  // Helper function to get background color for document type
  const getBgColorForType = (typeName: string) => {
    switch (typeName) {
      case 'aadhar': return 'bg-blue-50';
      case 'pan': return 'bg-yellow-50';
      case 'bank_account': return 'bg-green-50';
      case 'driving_license': return 'bg-purple-50';
      case 'passport': return 'bg-cyan-50';
      case 'voter_id': return 'bg-pink-50';
      case 'other': default: return 'bg-orange-50';
    }
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 w-full">
      {typesToDisplay.map((type) => {
        const Icon = getIconForType(type.name);
        const bgColor = getBgColorForType(type.name);
        const isSelected = selectedTypeId === type.id;
        
        const displayLabel = type.description && type.description.length <= 8 ? 
          type.description : 
          type.name.replace('_', ' ');
        
        return (
          <div
            key={type.id}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border transition-colors
              ${isSelected 
                ? `${bgColor} border-primary text-primary` 
                : `${bgColor} border-transparent hover:border-gray-300`
              }
            `}
            onClick={() => onChange(type.id)}
          >
            <Icon className={`h-6 w-6 mb-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
            <span className="text-xs font-medium capitalize">{displayLabel}</span>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentTypeSelector;
