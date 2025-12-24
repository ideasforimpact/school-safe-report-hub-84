
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileCheck, Download, FileText, X, File } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmployeeExcel } from '@/services/employee/importEmployeeService';
import { downloadExcelTemplate, downloadCSVTemplate, getTemplateFormatInfo } from '@/services/employee/utils/templateGenerator';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onImportEmployees: (file: File, importClientId?: string) => Promise<void>;
  clientId?: string;
}

const ImportEmployeeDialog = ({ isOpen, setIsOpen, onImportEmployees, clientId }: ImportEmployeeDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [manualClientId, setManualClientId] = useState<string>(clientId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const readFileWithRetry = async (file: File, retries = 5, delay = 300): Promise<ArrayBuffer> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await file.arrayBuffer();
      } catch (err: any) {
        console.warn(`Read attempt ${attempt} failed`, err);
        if (attempt === retries) throw err;
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw new Error("Unable to read file after retries");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const originalFile = e.target.files[0];
    try {
      const buffer = await readFileWithRetry(originalFile, 5, 300);

      const safeFile = new window.File([buffer], originalFile.name, {
        type: originalFile.type,
      });
      setSelectedFile(safeFile);
      setIsVerified(false);

      toast.success("File uploaded successfully.");
    } catch (err: any) {
      console.error("Could not read file:", err);

      if (err?.name === "NotReadableError") {
        toast.error("The file is temporarily locked by Excel. Please wait 1–2 seconds and try again.");
      } else {
        toast.error("Failed to load file. Please try again.");
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsVerified(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualClientId(e.target.value);
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to verify");
      return;
    }
    
    console.log("Starting verification for file:", selectedFile.name);
    setIsVerifying(true);
    try {
      // Use the effective client ID for validation
      const effectiveClientId = manualClientId || clientId;
      const errors = await validateEmployeeExcel(selectedFile, effectiveClientId);
      
      if (errors.length > 0) {
        // Show the first few errors in toast
        const displayErrors = errors.slice(0, 3);
        displayErrors.forEach(error => toast.error(error));
        
        // If there are more errors, show a summary toast
        if (errors.length > 3) {
          toast.error(`${errors.length - 3} more validation errors. Check console for details.`);
        }
        
        // Log all errors to console for debugging
        console.error('Excel validation errors:', errors);
        
        setIsVerified(false);
      } else {
        toast.success('Excel file validated successfully');
        setIsVerified(true);
      }
    } catch (error) {
      console.error("Error validating file:", error);
      toast.error(`Validation failed: ${(error as Error).message}`);
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }
    
    if (!isVerified) {
      toast.error("Please verify the file before importing");
      return;
    }
    
    console.log("Starting import process with client ID:", manualClientId || clientId);
    setIsLoading(true);
    try {
      // Use the manually entered clientId or fall back to the prop
      const effectiveClientId = manualClientId || clientId;
      console.log("Using effective client ID for import:", effectiveClientId);
      
      await onImportEmployees(selectedFile, effectiveClientId);
      setIsOpen(false);
      setSelectedFile(null);
      setIsVerified(false);
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error(`Import failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to reset all state
  const resetState = () => {
    setSelectedFile(null);
    setIsVerified(false);
    setIsVerifying(false);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle dialog close - reset state when closing
  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    resetState();
    setIsOpen(false);
  };

  // Function to programmatically click the file input
  const triggerFileSelect = () => {
    console.log("Triggering file selection dialog");
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Template Download Section */}
          <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-800">Sample Template Available</Label>
            </div>
            <p className="text-xs text-blue-700">
              Download a sample file with the correct format and column headers to get started
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcelTemplate}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="h-3 w-3 mr-1" />
                Excel Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSVTemplate}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV Template
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file-upload">Upload file</Label>
            {selectedFile ? (
              // Show selected file with highlight
              <div className="border-2 border-blue-500 bg-blue-50 rounded-md p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    disabled={isLoading || isVerifying}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {isVerified && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <FileCheck className="h-4 w-4" />
                    <p className="text-xs font-medium">File verified successfully</p>
                  </div>
                )}
              </div>
            ) : (
              // Show upload area when no file is selected
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors"
                onClick={triggerFileSelect}
              >
                <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={isLoading || isVerifying}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the outer div's onClick from triggering
                    triggerFileSelect();
                  }}
                >
                  Select File
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: XLSX, XLS, CSV
                </p>
              </div>
            )}
          </div>

          {/* Uncomment if client ID input is needed
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID (Optional)</Label>
            <Input
              id="clientId"
              value={manualClientId}
              onChange={handleClientIdChange}
              placeholder="Enter client ID for these employees"
            />
            <p className="text-xs text-gray-500">
              {clientId ? "Default client ID will be used if left blank." : "Enter the client ID for these employees."}
            </p>
          </div> */}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handleVerify}
            disabled={!selectedFile || isLoading || isVerifying}
            className="w-full sm:w-auto mb-2 sm:mb-0"
          >
            {isVerifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isVerified ? (
              <FileCheck className="mr-2 h-4 w-4" />
            ) : null}
            Verify
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isLoading || isVerifying}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || isLoading || !isVerified}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
