
import { useState } from 'react';
import { FileItem } from '@/types/fileTypes';

export function useFilesManagement() {
  // Supporting files state
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);

  const handleFilesChange = (files: FileItem[]) => {
    // Ensure all files have base64 data
    const validFiles = files.map(file => ({
      ...file,
      base64: file.base64 || '' // Ensure base64 is never undefined
    }));
    setSupportingFiles(validFiles);
  };

  return {
    supportingFiles,
    handleFilesChange
  };
}
