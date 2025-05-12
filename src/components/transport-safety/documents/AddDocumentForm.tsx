
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { VehicleDocument } from '@/types/transportSafety';
import { FileItem } from '@/types/fileTypes';
import { Upload, X, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AddDocumentFormProps {
  vehicleId: string;
  onClose: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ vehicleId, onClose }) => {
  const { addDocument } = useTransportSafety();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Omit<VehicleDocument, 'id'>>({
    defaultValues: {
      type: 'insurance',
      number: '',
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      issuedBy: '',
      status: 'valid',
      notes: null,
      lastUpdated: new Date().toISOString(),
      fileUrls: [],
      provider: '',
      verificationStatus: 'unverified'
    }
  });

  const documentType = watch('type');
  const [files, setFiles] = useState<FileItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
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
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64,
      };
      
      setFiles([...files, newFile]);
    };
    
    reader.readAsDataURL(file);
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  const onSubmit = (data: Omit<VehicleDocument, 'id'>) => {
    // Convert file items to URLs (in a real app, these would be stored in a CDN)
    // For our demo, we'll just use the file names as placeholders
    const fileUrls = files.map(file => file.base64);

    addDocument(vehicleId, {
      ...data,
      issuedDate: new Date(data.issuedDate).toISOString(),
      expiryDate: new Date(data.expiryDate).toISOString(),
      fileUrls: fileUrls
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Document Type*</Label>
        <Select defaultValue="insurance" onValueChange={(value) => register('type').onChange({ target: { name: 'type', value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="fitness">Fitness Certificate</SelectItem>
            <SelectItem value="pollution">Pollution Certificate</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">{documentType === 'insurance' ? 'Policy Number' : 'Certificate Number'}*</Label>
        <Input 
          id="number" 
          {...register('number', { required: "Number is required" })}
          placeholder="Enter document number"
        />
        {errors.number && 
          <p className="text-red-500 text-sm">{errors.number.message}</p>
        }
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuedDate">Issue Date*</Label>
          <Input 
            id="issuedDate" 
            type="date"
            {...register('issuedDate', { required: "Issue date is required" })}
          />
          {errors.issuedDate && 
            <p className="text-red-500 text-sm">{errors.issuedDate.message}</p>
          }
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date*</Label>
          <Input 
            id="expiryDate" 
            type="date"
            {...register('expiryDate', { required: "Expiry date is required" })}
          />
          {errors.expiryDate && 
            <p className="text-red-500 text-sm">{errors.expiryDate.message}</p>
          }
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuedBy">Issuer*</Label>
        <Input 
          id="issuedBy" 
          {...register('issuedBy', { required: "Issuer is required" })}
          placeholder="Enter issuer name"
        />
        {errors.issuedBy && 
          <p className="text-red-500 text-sm">{errors.issuedBy.message}</p>
        }
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Provider*</Label>
        <Input 
          id="provider" 
          {...register('provider', { required: "Provider is required" })}
          placeholder="Enter provider name"
        />
        {errors.provider && 
          <p className="text-red-500 text-sm">{errors.provider.message}</p>
        }
      </div>
      
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label>Document Files</Label>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 mb-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center">
                  <File className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* File Upload Button */}
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
          <input 
            id="fileUpload"
            type="file" 
            className="hidden"
            onChange={handleFileUpload} 
          />
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">Drag and drop file here, or click to select file</p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG • Max size: 5MB</p>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Add Document
        </Button>
      </div>
    </form>
  );
};

export default AddDocumentForm;
