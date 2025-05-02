
import { useState } from 'react';
import { FileItem } from '@/types/fileTypes';

export function useFilesManagement() {
  // Supporting files state
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);

  const handleFilesChange = (files: FileItem[]) => {
    setSupportingFiles(files);
  };

  return {
    supportingFiles,
    handleFilesChange
  };
}
