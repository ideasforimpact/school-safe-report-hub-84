
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
import { FileUp, Upload, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { validateExcelData } from '@/services/employee/utils/excelValidationUtils';
import { RawEmployeeData } from '@/services/employee/types/importTypes';
import { parseExcelFile } from '@/services/employee/utils/excelProcessingUtils';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onImportEmployees: (file: File) => Promise<void>;
}

const ImportEmployeeDialog = ({ isOpen, setIsOpen, onImportEmployees }: ImportEmployeeDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<RawEmployeeData[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setIsVerified(false); // Reset verification status when file changes
        setValidationErrors([]);
        setParsedData([]);
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
        setIsVerified(false); // Reset verification status when file changes
        setValidationErrors([]);
        setParsedData([]);
      }
    }
  };

  const handleVerify = async () => {
    if (!file) {
      toast.error('Please select a file to verify');
      return;
    }

    try {
      setIsVerifying(true);
      setValidationErrors([]);
      
      // Parse the Excel file
      const data = await parseExcelFile(file);
      setParsedData(data);
      
      // Validate the parsed data
      const errors = validateExcelData(data);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsVerified(false);
        toast.error(`Found ${errors.length} validation errors`);
      } else {
        setIsVerified(true);
        toast.success('Data verification passed. Ready to import!');
      }
    } catch (error) {
      console.error('Error verifying Excel data:', error);
      toast.error('Failed to verify Excel data');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    if (!isVerified) {
      toast.error('Please verify the file data before importing');
      return;
    }

    try {
      setIsUploading(true);
      await onImportEmployees(file);
      setFile(null);
      setIsVerified(false);
      setValidationErrors([]);
      setParsedData([]);
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
      if (!open) {
        setFile(null);
        setIsVerified(false);
        setValidationErrors([]);
        setParsedData([]);
      }
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
        
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium">Validation Errors</p>
            </div>
            <ul className="text-sm text-red-600 space-y-1 pl-6 list-disc">
              {validationErrors.slice(0, 10).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {validationErrors.length > 10 && (
                <li>...and {validationErrors.length - 10} more errors</li>
              )}
            </ul>
          </div>
        )}
        
        {isVerified && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <p>All data is valid and ready to import</p>
            </div>
            <p className="text-sm text-green-600 mt-1">
              {parsedData.length} employee records will be imported
            </p>
          </div>
        )}
        
        <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
          <Button 
            onClick={handleVerify} 
            disabled={!file || isVerifying}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isVerifying ? 'Verifying...' : 'Verify Data'}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading || !isVerified}
            className="gap-2 w-full sm:w-auto"
          >
            {isUploading ? 'Importing...' : 'Import Employees'}
            {!isUploading && <Upload className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
