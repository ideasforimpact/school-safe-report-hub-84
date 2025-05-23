
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import DocumentTypeSelector from './DocumentTypeSelector';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Employee } from '@/types/employeeVerification';
import { toast } from 'sonner';

interface SimpleDocumentUploadProps {
  employee: Employee;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SimpleDocumentUpload: React.FC<SimpleDocumentUploadProps> = ({ 
  employee, 
  onSuccess, 
  onCancel 
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('2'); // Default to PAN Card
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addDocument, fetchEmployeeDocuments } = useEmployeeVerification();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTypeId) {
      toast.error('Please select a document type');
      return;
    }

    if (!documentNumber.trim()) {
      toast.error('Please enter the document number');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      const newDocument = {
        employeeId: employee.id,
        documentTypeId: selectedTypeId,
        documentNumber: documentNumber.trim(),
        employee_docs_log: [
          {
            timestamp: new Date().toISOString(),
            action: 'document_added',
            notes: 'Document uploaded',
            response: {}
          }
        ]
      };

      const result = await addDocument(newDocument, selectedFile);

      if (result) {
        toast.success('Document uploaded successfully');
        // Refresh the employee documents
        fetchEmployeeDocuments(employee.id);
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Upload className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-medium">Upload Document for Verification</h2>
      </div>

      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Select Document Type <span className="text-red-500">*</span>
        </Label>
        <DocumentTypeSelector 
          selectedTypeId={selectedTypeId} 
          onChange={setSelectedTypeId} 
        />
      </div>

      {/* Document Number Input */}
      <div className="space-y-2">
        <Label htmlFor="documentNumber" className="text-sm font-medium">
          Enter PAN Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="documentNumber"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder="ABCDE1234F"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          For security, only the last 2 digits will be visible after submission
        </p>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Document Image <span className="text-red-500">*</span>
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Drag and drop file here, or click to select file</p>
          <p className="text-xs text-gray-500 mb-4">
            Supported formats: JPG, PNG, PDF • Max file size: 5MB
          </p>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Browse Files
          </Button>
        </div>
        
        {selectedFile && (
          <div className="mt-2 p-2 bg-blue-50 rounded border text-sm">
            <span className="text-blue-800">Selected: {selectedFile.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
};

export default SimpleDocumentUpload;
