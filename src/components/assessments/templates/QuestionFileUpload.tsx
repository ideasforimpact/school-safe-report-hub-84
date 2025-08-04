import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import { QuestionFile } from '@/types/assessment';
import { questionFileService } from '@/services/assessment/questionFileService';
import { toast } from 'sonner';

interface QuestionFileUploadProps {
  questionId: string;
  questionNumber: number;
  files: QuestionFile[];
  onFilesChange: (files: QuestionFile[]) => void;
  assessmentName: string;
  clientId?: string;
  employeeId?: string;
}

const QuestionFileUpload: React.FC<QuestionFileUploadProps> = ({
  questionId,
  questionNumber,
  files,
  onFilesChange,
  assessmentName,
  clientId,
  employeeId
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (!clientId || !employeeId) {
      toast.error('User information not available for file upload');
      return;
    }

    setUploading(true);

    try {
      // Convert FileList to FileItem array
      const fileItems: FileItem[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Check file size (30MB limit)
        if (file.size > 30 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 30MB limit`);
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        fileItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
          uploadedAt: new Date(),
          status: 'uploading'
        });
      }

      if (fileItems.length === 0) {
        setUploading(false);
        return;
      }

      // Validate files
      const validation = questionFileService.validateFiles(fileItems);
      if (!validation.valid) {
        validation.errors.forEach(error => toast.error(error));
        setUploading(false);
        return;
      }

      // Upload files
      const uploadedFiles = await questionFileService.uploadQuestionFiles(
        fileItems,
        clientId,
        employeeId,
        assessmentName,
        questionNumber
      );

      // Convert to QuestionFile format
      const questionFiles: QuestionFile[] = uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        path: file.path,
        uploadedAt: file.uploadedAt.toISOString()
      }));

      // Update files list
      onFilesChange([...files, ...questionFiles]);
      toast.success(`Successfully uploaded ${questionFiles.length} file(s)`);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }

    // Clear the input
    e.target.value = '';
  };

  const handleRemoveFile = async (fileToRemove: QuestionFile) => {
    try {
      // Delete from storage
      await questionFileService.deleteQuestionFile(fileToRemove.path);
      
      // Update files list
      const updatedFiles = files.filter(file => file.id !== fileToRemove.id);
      onFilesChange(updatedFiles);
      
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* File upload button */}
      <div>
        <input
          type="file"
          id={`file-upload-${questionId}`}
          className="sr-only"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Label
          htmlFor={`file-upload-${questionId}`}
          className={`inline-flex items-center px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md hover:border-gray-400 cursor-pointer transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Files (Max 30MB each)'}
        </Label>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Uploaded Files:</Label>
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <File className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file)}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionFileUpload;