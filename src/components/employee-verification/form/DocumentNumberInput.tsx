import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DocumentNumberInputProps {
  documentType: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  fieldType?: string; // For bank account sub-fields
}

const DocumentNumberInput: React.FC<DocumentNumberInputProps> = ({
  documentType,
  value,
  onChange,
  required = true,
  className,
  fieldType
}) => {
  // Document type configurations
  const getDocumentConfig = (type: string, field?: string) => {
    // Handle bank account sub-fields
    if (type === 'bank_account') {
      if (field === 'account_number') {
        return {
          label: 'Account Number',
          placeholder: '123456789012',
          maxLength: 18,
          pattern: /^\d+$/,
          format: (val: string) => val.replace(/\D/g, ''),
          validate: (val: string) => /^\d{9,18}$/.test(val)
        };
      }
      if (field === 'ifsc_code') {
        return {
          label: 'IFSC Code',
          placeholder: 'ABCD0123456',
          maxLength: 11,
          pattern: /^[A-Z]{4}[0-9A-Z]{7}$/,
          format: (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          validate: (val: string) => /^[A-Z]{4}[0-9A-Z]{7}$/.test(val)
        };
      }
    }

    switch (type) {
      case 'aadhar':
        return {
          label: 'Aadhar Number',
          placeholder: '1234 5678 9012',
          maxLength: 14, // 12 digits + 2 spaces
          pattern: /^\d{4}\s?\d{4}\s?\d{4}$/,
          format: (val: string) => {
            const digits = val.replace(/\s/g, '');
            if (digits.length <= 4) return digits;
            if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
            return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
          },
          validate: (val: string) => /^\d{4}\s\d{4}\s\d{4}$/.test(val)
        };
      case 'pan':
        return {
          label: 'PAN Number',
          placeholder: 'ABCDE1234F',
          maxLength: 10,
          pattern: /^[A-Z]{5}\d{4}[A-Z]$/,
          format: (val: string) => val.toUpperCase(),
          validate: (val: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(val)
        };
      case 'driving_license':
        return {
          label: 'Driving License Number',
          placeholder: 'DL-XXXXXXXX',
          maxLength: 20,
          pattern: /^[A-Z0-9-]+$/,
          format: (val: string) => val.toUpperCase(),
          validate: (val: string) => val.length >= 8
        };
      case 'voter_id':
        return {
          label: 'Voter ID Number',
          placeholder: 'ABC1234567',
          maxLength: 15,
          pattern: /^[A-Z0-9]+$/,
          format: (val: string) => val.toUpperCase(),
          validate: (val: string) => val.length >= 8
        };
      case 'passport':
        return {
          label: 'Passport Number',
          placeholder: 'A1234567',
          maxLength: 8,
          pattern: /^[A-Z]\d{7}$/,
          format: (val: string) => val.toUpperCase(),
          validate: (val: string) => /^[A-Z]\d{7}$/.test(val)
        };
      default:
        return {
          label: 'Document Number',
          placeholder: 'Enter document number',
          maxLength: 20,
          pattern: /^[A-Z0-9\s-]+$/,
          format: (val: string) => val,
          validate: (val: string) => val.length > 0
        };
    }
  };

  const config = getDocumentConfig(documentType, fieldType);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Apply character restrictions based on document type
    if (documentType === 'aadhar') {
      inputValue = inputValue.replace(/[^\d\s]/g, '');
    } else if (documentType === 'pan' || documentType === 'driving_license' || documentType === 'voter_id' || documentType === 'passport') {
      inputValue = inputValue.replace(/[^A-Za-z0-9-]/g, '');
    } else if (documentType === 'bank_account' && fieldType === 'account_number') {
      inputValue = inputValue.replace(/\D/g, '');
    } else if (documentType === 'bank_account' && fieldType === 'ifsc_code') {
      inputValue = inputValue.replace(/[^A-Za-z0-9]/g, '');
    }

    // Apply max length
    if (inputValue.length > config.maxLength) {
      inputValue = inputValue.slice(0, config.maxLength);
    }

    // Apply formatting
    const formattedValue = config.format(inputValue);
    onChange(formattedValue);
  };

  const getValidationMessage = () => {
    if (!value) return null;
    
    if (!config.validate(value)) {
      if (documentType === 'bank_account') {
        if (fieldType === 'account_number') {
          return 'Account number must be 9-18 digits';
        }
        if (fieldType === 'ifsc_code') {
          return 'IFSC code must be in format: ABCD0123456';
        }
      }
      
      switch (documentType) {
        case 'aadhar':
          return 'Aadhar number must be 12 digits in format: 1234 5678 9012';
        case 'pan':
          return 'PAN must be in format: ABCDE1234F';
        case 'driving_license':
          return 'Driving license number must be at least 8 characters';
        case 'voter_id':
          return 'Voter ID must be at least 8 characters';
        case 'passport':
          return 'Passport must be in format: A1234567';
        default:
          return 'Invalid format';
      }
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  // Create unique ID to prevent cross-contamination
  const inputId = `${documentType}${fieldType ? `_${fieldType}` : ''}_input`;

  return (
    <div className={className}>
      <Label htmlFor={inputId} className="text-sm font-medium">
        {config.label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="mt-1">
        <Input
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={config.placeholder}
          required={required}
          maxLength={config.maxLength}
          className={cn(
            validationMessage && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      </div>
      {validationMessage && (
        <p className="text-sm text-red-500 mt-1">{validationMessage}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Format: {config.placeholder}
      </p>
    </div>
  );
};

export default DocumentNumberInput;