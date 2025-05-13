
import React, { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DocumentFormSchema, DocumentFormValues } from './documentFormSchema';
import { FileItem } from '@/types/fileTypes';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { getDocumentPlaceholder } from '../utils/documentUtils';

interface DocumentFormProps {
  selectedTypeId: string;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (values: DocumentFormValues) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
  children: ReactNode;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  selectedTypeId,
  files,
  isSubmitting,
  onSubmit,
  onCancel,
  children,
}) => {
  const { documentTypes } = useEmployeeVerification();

  const getDocumentTypeName = (typeId: string): string => {
    const docType = documentTypes.find(type => type.id === typeId);
    return docType?.name || '';
  };

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: {
      documentNumber: '',
      documentImage: '',
    },
  });

  const handleSubmit = (values: DocumentFormValues) => {
    // If there's a file uploaded, attach it to the form values
    if (files.length > 0 && files[0].base64) {
      values.documentImage = files[0].base64;
    }
    onSubmit(values);
  };

  const typeName = getDocumentTypeName(selectedTypeId);
  const placeholder = getDocumentPlaceholder(typeName as any);
  const isOptional = typeName === 'other';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="documentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Number {isOptional && "(Optional)"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={placeholder} 
                  required={!isOptional}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Document Image</FormLabel>
          {children}
          {files.length === 0 && (
            <FormField
              control={form.control}
              name="documentImage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              field.onChange(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (files.length === 0 && !form.watch('documentImage'))}
          >
            {isSubmitting ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
