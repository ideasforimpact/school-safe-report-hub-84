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

  // Allowed file types: PDF, DOC, DOCX, PNG, JPEG, JPG
  const ALLOWED_FILE_TYPES = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'image/png', // PNG
    'image/jpeg', // JPEG
    'image/jpg' // JPG
  ];

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const isValidFileType = (file: File): boolean => {
    // Check by MIME type
    if (ALLOWED_FILE_TYPES.includes(file.type)) {
      return true;
    }
    
    // Fallback: Check by file extension
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setSelecting(true);

    try {
      // Only take the first file since we only allow single file upload
      const file = selectedFiles[0];
      
      // Validate file type
      if (!isValidFileType(file)) {
        toast.error(`File "${file.name}" has an invalid format. Allowed formats: PDF, DOC, DOCX, PNG, JPEG, JPG.`);
        setSelecting(false);
        e.target.value = '';
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds the 10MB size limit. Maximum file size is 10MB.`);
        setSelecting(false);
        e.target.value = '';
        return;
      }

      // Check for duplicate files
      const isDuplicate = [...files, ...pendingFiles].some(
        existingFile => existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        toast.error(`File "${file.name}" is already added.`);
        setSelecting(false);
        e.target.value = '';
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
      console.log(`[QuestionFileUpload] Setting pending file for questionId: ${questionId}`, newPendingFile);
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

  // Debug logging
  React.useEffect(() => {
    console.log(`[QuestionFileUpload] Render for questionId: ${questionId}`, {
      questionId,
      filesCount: files.length,
      pendingFilesCount: pendingFiles.length,
      files: files.map(f => ({ id: f.id, name: f.name })),
      pendingFiles: pendingFiles.map(f => ({ id: f.id, name: f.name }))
    });
  }, [questionId, files, pendingFiles]);

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
          accept=".pdf,.doc,.docx,.png,.jpeg,.jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
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
          {selecting ? 'Selecting...' : 'Select File (Max 10MB)'}
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