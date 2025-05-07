
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Upload } from 'lucide-react';
import { VerificationDocumentType } from '@/types/employeeVerification';
import DocumentTypeSelector from './DocumentTypeSelector';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';

interface AddDocumentFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

const formSchema = z.object({
  documentNumber: z.string().min(1, 'Document number is required'),
  documentImage: z.string().min(1, 'Document image is required'),
});

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ employeeId, onSuccess }) => {
  const [selectedType, setSelectedType] = useState<VerificationDocumentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addDocument } = useEmployeeVerification();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentNumber: '',
      documentImage: '/placeholder.svg', // Using placeholder as default for demo
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedType) {
      toast({
        title: 'Error',
        description: 'Please select a document type',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      addDocument({
        employeeId,
        documentType: selectedType,
        documentNumber: values.documentNumber,
        documentImage: values.documentImage,
        verificationStatus: 'pending',
      });
      toast({
        title: 'Document Added',
        description: 'The document has been added for verification.',
      });
      // Reset form
      form.reset();
      setSelectedType(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Add Document for Verification</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Select Document Type</h4>
            <DocumentTypeSelector selectedType={selectedType} onChange={setSelectedType} />
            {!selectedType && <p className="text-xs text-red-500 mt-2">Please select a document type</p>}
          </div>

          {selectedType && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            selectedType === 'aadhar' ? '1234 5678 9012' : 
                            selectedType === 'pan' ? 'ABCDE1234F' :
                            selectedType === 'driving_license' ? 'DL98765432109876' :
                            selectedType === 'passport' ? 'A1234567' : 'XXXX1234'
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* For simplicity in this demo, we're just using a text field
                    In a real application, this would be a file upload component */}
                <FormField
                  control={form.control}
                  name="documentImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Document Image</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input {...field} />
                          <Button type="button" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Browse
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        In a real implementation, this would be a file upload component
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  Add Document for Verification
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDocumentForm;
