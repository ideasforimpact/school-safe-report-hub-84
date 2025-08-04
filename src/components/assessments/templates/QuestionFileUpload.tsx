import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Loader2, Clock } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import { QuestionFile } from '@/types/assessment';
import { toast } from 'sonner';

interface PendingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending';
}

interface QuestionFileUploadProps {
  questionId: string;
  questionNumber: number;
  files: QuestionFile[];
  pendingFiles: PendingFile[];
  onFilesChange: (files: QuestionFile[]) => void;
  onPendingFilesChange: (files: PendingFile[]) => void;
}

const QuestionFileUpload: React.FC<QuestionFileUploadProps> = ({
  questionId,
  questionNumber,
  files,
  pendingFiles,
  onFilesChange,
  onPendingFilesChange
}) => {
  const [selecting, setSelecting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setSelecting(true);

    try {
      const newPendingFiles: PendingFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Check file size (30MB limit)
        if (file.size > 30 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 30MB limit`);
          continue;
        }

        // Check for duplicate files
        const isDuplicate = [...files, ...pendingFiles].some(
          existingFile => existingFile.name === file.name && existingFile.size === file.size
        );

        if (isDuplicate) {
          toast.error(`${file.name} is already added`);
          continue;
        }

        newPendingFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          status: 'pending'
        });
      }

      if (newPendingFiles.length > 0) {
        onPendingFilesChange([...pendingFiles, ...newPendingFiles]);
        toast.success(`Added ${newPendingFiles.length} file(s) for upload`);
      }

    } catch (error) {
      console.error('Error selecting files:', error);
      toast.error('Failed to select files');
    } finally {
      setSelecting(false);
    }

    // Clear the input
    e.target.value = '';
  };

  const handleRemoveFile = (fileToRemove: QuestionFile) => {
    const updatedFiles = files.filter(file => file.id !== fileToRemove.id);
    onFilesChange(updatedFiles);
    toast.success('File removed successfully');
  };

  const handleRemovePendingFile = (fileToRemove: PendingFile) => {
    const updatedPendingFiles = pendingFiles.filter(file => file.id !== fileToRemove.id);
    onPendingFilesChange(updatedPendingFiles);
    toast.success('File removed successfully');
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
          disabled={selecting}
        />
        <Label
          htmlFor={`file-upload-${questionId}`}
          className={`inline-flex items-center px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md hover:border-gray-400 cursor-pointer transition-colors ${
            selecting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {selecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {selecting ? 'Selecting...' : 'Select Files (Max 30MB each)'}
        </Label>
      </div>

      {/* Files list */}
      {(files.length > 0 || pendingFiles.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Files:</Label>
          <div className="space-y-1">
            {/* Uploaded files */}
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-2"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <File className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {formatFileSize(file.size)} • Uploaded
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
            
            {/* Pending files */}
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-md p-2"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {formatFileSize(file.size)} • Pending upload
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePendingFile(file)}
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