import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import { useToast } from '@/hooks/use-toast';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';

interface CustomDocumentUploaderProps {
  documentName: string;
  setDocumentName: (name: string) => void;
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  onSubmit: (documentName: string, files: FileItem[]) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const CustomDocumentUploader: React.FC<CustomDocumentUploaderProps> = ({
  documentName,
  setDocumentName,
  files,
  setFiles,
  onSubmit,
  isProcessing,
  onCancel
}) => {
  const { toast } = useToast();

  const handleFilesChange = (newFiles: FileItem[]) => {
    // Keep parent state in sync with uploader's internal state
    setFiles(newFiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a document name',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please upload at least one file',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(documentName.trim(), files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Document Name Input */}
      <div>
        <Label htmlFor="documentName" className="text-sm font-medium">
          Document Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="documentName"
          type="text"
          value={documentName}
          onChange={(e) => {
            const value = e.target.value || '';
            // Hard limit to 50 characters even on paste
            setDocumentName(value.slice(0, 100));
          }}
          placeholder="Enter document name (e.g., Employment Contract, Certificate, etc.)"
          className="mt-1"
          maxLength={100}
          required
          disabled={isProcessing}
        />
        <p className="mt-1 text-xs text-gray-400">
          Maximum 100 characters.
        </p>
      </div>

      {/* File Upload Area */}
      <div>
        <Label className="text-sm font-medium">
          Document Files <span className="text-red-500">*</span>
        </Label>
        <div className="mt-2">
          <ReusableFileUploader
            onFilesChange={handleFilesChange}
            initialFiles={files}
            maxFiles={1}
            maxSize={10}
            maxTotalSize={10}
            allowedTypes={[
              'application/pdf',
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
            ]}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
            showFileList={true}
            className="w-full"
                disabled={isProcessing}
              />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing || files.length === 0}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CustomDocumentUploader;