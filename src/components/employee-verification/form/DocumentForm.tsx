
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import { getDocumentPlaceholder } from '../utils/documentUtils';
import { FileItem } from '@/types/fileTypes';
import { toast } from '@/components/ui/use-toast';

interface DocumentFormProps {
  employeeId?: string;
  selectedTypeId: string;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ 
  employeeId, 
  selectedTypeId, 
  files, 
  isSubmitting, 
  onSubmit, 
  onCancel,
  onFileUploaded 
}) => {
  const form = useForm({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      employeeId: employeeId || '',
      documentTypeId: selectedTypeId,
      documentNumber: '',
      documentImage: '',
    },
  });

  const documentPlaceholder = getDocumentPlaceholder(selectedTypeId);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [documentNumberHelp, setDocumentNumberHelp] = useState<string>('For security, only the last 2 digits will be visible after submission');

  const handleSubmit = (data: any) => {
    if (!data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a document image',
        variant: 'destructive',
      });
      return;
    }

    // Prepare the upload data - only send essential fields
    const uploadData = {
      employeeId: data.employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: data.documentNumber,
      documentImage: data.documentImage,
    };

    console.log('Submitting document with data:', {
      employeeId: uploadData.employeeId,
      documentTypeId: uploadData.documentTypeId,
      documentNumber: uploadData.documentNumber ? 'Provided' : 'Not provided',
      imageSize: uploadData.documentImage ? uploadData.documentImage.length : 0,
    });

    onSubmit(uploadData);
  };

  const handleFileChange = (base64: string, filename: string) => {
    form.setValue('documentImage', base64);
    setSelectedFileName(filename);
    onFileUploaded(base64);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {employeeId && <input type="hidden" {...form.register('employeeId')} />}
        
        <FormField
          control={form.control}
          name="documentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {documentPlaceholder || "Document Number"} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={`Enter ${documentPlaceholder || "document number"}`} 
                  {...field} 
                />
              </FormControl>
              {documentNumberHelp && (
                <p className="text-xs text-gray-500 mt-1">{documentNumberHelp}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="documentImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Image <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {!selectedFileName ? (
                    <DocumentFileUploader 
                      files={files}
                      setFiles={() => {}} // Handled by parent
                      onFileUploaded={(base64, file) => handleFileChange(base64, file?.name || '')}
                    />
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-sm truncate">{selectedFileName}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          form.setValue('documentImage', '');
                          setSelectedFileName('');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
