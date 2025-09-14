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
      // Only take the first file since we only allow single file upload
      const file = selectedFiles[0];
      
      // Check file size (30MB limit)
      if (file.size > 30 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 30MB limit`);
        return;
      }

      // Check for duplicate files
      const isDuplicate = [...files, ...pendingFiles].some(
        existingFile => existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        toast.error(`${file.name} is already added`);
        return;
      }

      // Clear existing files and add the new single file
      const newPendingFile: PendingFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending'
      };

      // Replace any existing pending files with the new single file
      onPendingFilesChange([newPendingFile]);
      
      // Also clear any existing uploaded files since we only allow one file per question
      if (files.length > 0) {
        onFilesChange([]);
      }
      
      toast.success(`File selected for upload`);

    } catch (error) {
      console.error('Error selecting file:', error);
      toast.error('Failed to select file');
    } finally {
      setSelecting(false);
    }

    // Clear the input
    e.target.value = '';
  };

  const handleRemoveFile = (fileToRemove: QuestionFile) => {
    // Since we only allow one file, clear all files when removing one
    onFilesChange([]);
    toast.success('File removed successfully');
  };

  const handleRemovePendingFile = (fileToRemove: PendingFile) => {
    // Since we only allow one file, clear all pending files when removing one
    onPendingFilesChange([]);
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
          {selecting ? 'Selecting...' : 'Select File (Max 30MB)'}
        </Label>
      </div>

      {/* Files list - Only show one file (single file per question) */}
      {(files.length > 0 || pendingFiles.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">File:</Label>
          <div className="space-y-1">
            {/* Show pending files first (if any), otherwise show uploaded files */}
            {pendingFiles.length > 0 ? (
              // Show pending file (new file being uploaded)
              pendingFiles.map((file) => (
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
              ))
            ) : (
              // Show uploaded file (existing file)
              files.map((file) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionFileUpload;