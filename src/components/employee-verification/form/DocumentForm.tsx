
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { documentFormSchema, DocumentFormValues } from './documentFormSchema';
import { VerificationDocumentType } from '@/types/employeeVerification';
import { FileItem } from '@/types/fileTypes';
import { getDocumentPlaceholder } from '../utils/documentUtils';

interface DocumentFormProps {
  selectedType: VerificationDocumentType;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (values: DocumentFormValues) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
  children: React.ReactNode;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ 
  selectedType, 
  files, 
  isSubmitting, 
  onSubmit, 
  onCancel,
  onFileUploaded,
  children 
}) => {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentNumber: '',
      documentImage: '/placeholder.svg', // Using placeholder as default for demo
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder={getDocumentPlaceholder(selectedType)} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {children}

        <div className="flex space-x-3 mt-8">
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700" 
            disabled={isSubmitting || files.length === 0}
          >
            Upload Document
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
