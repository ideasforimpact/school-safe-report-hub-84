
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
import FileList from '../file/FileList';
import { FileItem } from '@/types/fileTypes';
import { v4 as uuidv4 } from 'uuid';

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
  const [files, setFiles] = useState<FileItem[]>([]);
  const { toast } = useToast();
  const { addDocument } = useEmployeeVerification();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentNumber: '',
      documentImage: '/placeholder.svg', // Using placeholder as default for demo
    },
  });

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handlePreviewFile = (file: FileItem) => {
    // Preview logic would go here in a real app
    console.log('Preview file:', file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    
    // Simple file validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      const newFile: FileItem = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        base64: base64,
      };
      
      setFiles([...files, newFile]);
      
      // Set the document image field value to the base64 string
      form.setValue('documentImage', base64);
    };
    
    reader.readAsDataURL(file);
  };

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
        description: 'The document has been uploaded successfully and is pending verification.',
      });
      // Reset form
      form.reset();
      setSelectedType(null);
      setFiles([]);
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
    <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Upload className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-medium">Upload Document for Verification</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Upload employee documents for verification. Documents will be verified by the HR team.
        </p>
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
                            selectedType === 'passport' ? 'A1234567' : 
                            selectedType === 'voter_id' ? 'XYZ1234567' : 
                            'XXXX1234'
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Upload Document Image</FormLabel>
                  <div className="flex flex-col space-y-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Drag and drop file here, or click to select file</p>
                      <p className="text-xs text-gray-400">Supported formats: JPG, PNG, PDF • Max file size: 5MB</p>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                    
                    <FileList 
                      files={files} 
                      onPreviewFile={handlePreviewFile}
                      onRemoveFile={handleRemoveFile}
                    />

                    {form.formState.errors.documentImage && (
                      <p className="text-xs text-red-500">{form.formState.errors.documentImage.message}</p>
                    )}
                  </div>
                </div>

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
                    onClick={onSuccess}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDocumentForm;
