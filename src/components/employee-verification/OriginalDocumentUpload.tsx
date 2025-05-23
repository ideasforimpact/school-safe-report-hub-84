
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CreditCard, User, Car, Building2, Passport, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Employee } from '@/contexts/employee-verification/types';

interface DocumentType {
  id: string;
  name: string;
  icon: React.ReactNode;
  label: string;
}

const documentTypes: DocumentType[] = [
  { id: 'aadhar', name: 'aadhar', icon: <CreditCard className="h-6 w-6" />, label: 'Aadhar' },
  { id: 'pan', name: 'pan', icon: <CreditCard className="h-6 w-6" />, label: 'PAN Card' },
  { id: 'voter_id', name: 'voter_id', icon: <User className="h-6 w-6" />, label: 'Voter ID' },
  { id: 'driving_license', name: 'driving_license', icon: <Car className="h-6 w-6" />, label: 'Driving License' },
  { id: 'bank_account', name: 'bank_account', icon: <Building2 className="h-6 w-6" />, label: 'Bank Account' },
  { id: 'passport', name: 'passport', icon: <Passport className="h-6 w-6" />, label: 'Passport' },
  { id: 'other', name: 'other', icon: <FileText className="h-6 w-6" />, label: 'Other' },
];

interface OriginalDocumentUploadProps {
  employee: Employee;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const OriginalDocumentUpload: React.FC<OriginalDocumentUploadProps> = ({
  employee,
  onSuccess,
  onCancel
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('pan');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addDocument, fetchEmployeeDocuments } = useEmployeeVerification();

  const handleDocumentTypeSelect = (typeId: string) => {
    setSelectedDocumentType(typeId);
    setDocumentNumber('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload JPG, PNG, or PDF files only');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getDocumentNumberLabel = () => {
    switch (selectedDocumentType) {
      case 'aadhar': return 'Enter Aadhar Number';
      case 'pan': return 'Enter PAN Number';
      case 'voter_id': return 'Enter Voter ID Number';
      case 'driving_license': return 'Enter Driving License Number';
      case 'bank_account': return 'Enter Account Number';
      case 'passport': return 'Enter Passport Number';
      default: return 'Enter Document Number';
    }
  };

  const getDocumentNumberPlaceholder = () => {
    switch (selectedDocumentType) {
      case 'aadhar': return 'XXXX XXXX XXXX';
      case 'pan': return 'ABCDE1234F';
      case 'voter_id': return 'ABC1234567';
      case 'driving_license': return 'DL1234567890123';
      case 'bank_account': return '12345678901234';
      case 'passport': return 'A1234567';
      default: return 'Enter document number';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a document to upload');
      return;
    }

    if (!documentNumber.trim()) {
      toast.error('Please enter the document number');
      return;
    }

    setIsUploading(true);

    try {
      const documentData = {
        employeeId: employee.id,
        documentTypeId: selectedDocumentType,
        documentNumber: documentNumber.trim(),
        employee_docs_log: [
          {
            timestamp: new Date().toISOString(),
            action: 'document_added',
            notes: 'Document uploaded via original upload form',
            response: {}
          }
        ]
      };

      const result = await addDocument(documentData, selectedFile);

      if (result) {
        toast.success('Document uploaded successfully');
        // Refresh employee documents
        fetchEmployeeDocuments(employee.id);
        
        // Reset form
        setSelectedFile(null);
        setDocumentNumber('');
        setSelectedDocumentType('pan');
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('An error occurred while uploading the document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Upload className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Upload Document for Verification</h2>
      </div>

      {/* Document Type Selection */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">
          Select Document Type <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-7 gap-3">
          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleDocumentTypeSelect(type.id)}
              className={cn(
                "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                selectedDocumentType === type.id
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              )}
            >
              {type.icon}
              <span className="text-xs mt-2 font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Document Number Input */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">
          {getDocumentNumberLabel()} <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder={getDocumentNumberPlaceholder()}
          className="max-w-md"
        />
        <p className="text-xs text-gray-500 mt-1">
          For security, only the last 2 digits will be visible after submission
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">
          Document Image <span className="text-red-500">*</span>
        </Label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
          />
          
          {!selectedFile ? (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop file here, or click to select file</p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: JPG, PNG, PDF • Max file size: 5MB
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileSelect}
                className="mx-auto"
              >
                Browse Files
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isUploading || !selectedFile || !documentNumber.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
};

export default OriginalDocumentUpload;
