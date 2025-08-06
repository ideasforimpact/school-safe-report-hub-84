import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import { useToast } from '@/hooks/use-toast';

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
  const [isDragOver, setIsDragOver] = useState(false);

  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, images, or document files.`;
    }
    
    const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotalSize + file.size > MAX_FILE_SIZE) {
      return 'Total file size cannot exceed 30MB';
    }
    
    return null;
  };

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: FileItem[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'File Upload Error',
          description: validationError,
          variant: 'destructive',
        });
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newFiles.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
        });
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: 'File Upload Error',
          description: `Failed to read file: ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const remainingSize = MAX_FILE_SIZE - totalSize;

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
          onChange={(e) => setDocumentName(e.target.value)}
          placeholder="Enter document name (e.g., Employment Contract, Certificate, etc.)"
          className="mt-1"
          required
          disabled={isProcessing}
        />
      </div>

      {/* File Upload Area */}
      <div>
        <Label className="text-sm font-medium">
          Document Files <span className="text-red-500">*</span>
        </Label>
        <div className="mt-1">
          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <CardContent className="p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports PDF, Images, Word docs, and text files up to 30MB total
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isProcessing}
              >
                Browse Files
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Uploaded Files</Label>
          <div className="mt-2 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Total size: {formatFileSize(totalSize)} / {formatFileSize(MAX_FILE_SIZE)}
            {remainingSize > 0 && (
              <span className="text-green-600"> ({formatFileSize(remainingSize)} remaining)</span>
            )}
          </div>
        </div>
      )}

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
          disabled={isProcessing || !documentName.trim() || files.length === 0}
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