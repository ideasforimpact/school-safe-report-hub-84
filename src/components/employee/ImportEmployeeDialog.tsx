
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onImportEmployees: (file: File) => Promise<void>;
}

const ImportEmployeeDialog = ({ isOpen, setIsOpen, onImportEmployees }: ImportEmployeeDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Only Excel files (.xlsx, .xls) are supported');
      return false;
    }
    return true;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setIsUploading(true);
      await onImportEmployees(file);
      setFile(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error('Failed to import employees');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setFile(null);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) containing employee data
          </DialogDescription>
        </DialogHeader>
        
        <div
          className={`mt-4 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 mb-2">
            Drag & drop your Excel file here, or
          </p>
          <div className="relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
            />
            <Button variant="outline" type="button">
              Browse Files
            </Button>
          </div>
          
          {file && (
            <div className="mt-4 p-2 bg-gray-100 rounded w-full max-w-xs">
              <p className="text-sm text-gray-700 truncate text-center">
                {file.name}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading}
            className="gap-2"
          >
            {isUploading ? 'Importing...' : 'Import Employees'}
            {!isUploading && <Upload className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
