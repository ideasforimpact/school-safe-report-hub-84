
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import { getDocumentPlaceholder } from '../utils/documentUtils';
import DocumentTypeSelector from '../DocumentTypeSelector';

interface DocumentFormProps {
  employeeId: string;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ employeeId, onSubmit, isSubmitting }) => {
  const form = useForm({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      employeeId,
      documentTypeId: '',
      documentNumber: '',
      documentImage: '',
    },
  });

  const selectedDocumentType = form.watch('documentTypeId');
  const placeholder = getDocumentPlaceholder(selectedDocumentType);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <input type="hidden" {...form.register('employeeId')} />
        
        <FormField
          control={form.control}
          name="documentTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <FormControl>
                <DocumentTypeSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="documentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder={placeholder || "Enter document number"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="documentImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Document</FormLabel>
              <FormControl>
                <DocumentFileUploader 
                  value={field.value} 
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Uploading...' : 'Upload Document'}
        </Button>
      </form>
    </Form>
  );
};

export default DocumentForm;
