
import { useState, useCallback } from 'react';
import { FileItem } from '@/types/fileTypes';

export interface UseFilesManagementReturn {
  supportingFiles: FileItem[];
  handleFilesChange: (files: FileItem[]) => void;
  addFiles: (newFiles: FileItem[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
}

export const useFilesManagement = (): UseFilesManagementReturn => {
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);

  const handleFilesChange = useCallback((files: FileItem[]) => {
    console.log('Files changed in useFilesManagement:', files);
    setSupportingFiles(files);
  }, []);

  const addFiles = useCallback((newFiles: FileItem[]) => {
    setSupportingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setSupportingFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setSupportingFiles([]);
  }, []);

  return {
    supportingFiles,
    handleFilesChange,
    addFiles,
    removeFile,
    clearFiles
  };
};
