import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Employee, VerificationDocument } from '@/contexts/employee-verification/types';
import { toast } from 'sonner';
import { FileUploader } from '../FileUploader';
import { Loader2 } from 'lucide-react';

interface AddDocumentFormProps {
  employee: Employee;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ employee, onSuccess, onCancel }) => {
  const [documentTypeId, setDocumentTypeId] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { 
    documentTypes, 
    fetchDocumentTypes, 
    addDocument, 
    fetchEmployeeDocuments 
  } = useEmployeeVerification();

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!documentTypeId) {
      newErrors.documentTypeId = 'Document type is required';
    }

    if (!documentNumber) {
      newErrors.documentNumber = 'Document number is required';
    }

    if (!file) {
      newErrors.file = 'Document file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!file) {
        toast.error('Please select a file to upload');
        return;
      }

      const newDocument: Partial<VerificationDocument> = {
        employeeId: employee.id,
        documentTypeId,
        documentNumber,
        employee_docs_log: [
          {
            timestamp: new Date().toISOString(),
            action: 'document_added',
            notes: notes || 'Document added',
            response: {}
          }
        ]
      };

      const result = await addDocument(newDocument, file);

      if (result) {
        toast.success('Document added successfully');
        // Refresh the employee documents
        fetchEmployeeDocuments(employee.id);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to add document');
      }
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('An error occurred while adding the document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setFile(file);
    if (file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select
          value={documentTypeId}
          onValueChange={(value) => {
            setDocumentTypeId(value);
            setErrors(prev => ({ ...prev, documentTypeId: '' }));
          }}
        >
          <SelectTrigger id="documentType" className={errors.documentTypeId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.documentTypeId && <p className="text-red-500 text-sm">{errors.documentTypeId}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentNumber">Document Number</Label>
        <Input
          id="documentNumber"
          value={documentNumber}
          onChange={(e) => {
            setDocumentNumber(e.target.value);
            setErrors(prev => ({ ...prev, documentNumber: '' }));
          }}
          className={errors.documentNumber ? 'border-red-500' : ''}
        />
        {errors.documentNumber && <p className="text-red-500 text-sm">{errors.documentNumber}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about this document"
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Document</Label>
        <FileUploader
          onFileSelect={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={5 * 1024 * 1024} // 5MB
          className={errors.file ? 'border-red-500' : ''}
        />
        {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
        <p className="text-xs text-gray-500">
          Accepted formats: PDF, JPG, PNG. Max size: 5MB
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Document
        </Button>
      </div>
    </form>
  );
};

export default AddDocumentForm;
