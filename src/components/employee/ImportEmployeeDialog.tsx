
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmployeeExcel } from '@/services/employee/importEmployeeService';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      //console.log("File selected:", file.name, file.type, file.size);
      setSelectedFile(file);
      // Reset verification status when file changes
      setIsVerified(false);
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualClientId(e.target.value);
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to verify");
      return;
    }
    
    //console.log("Starting verification for file:", selectedFile.name);
    setIsVerifying(true);
    try {
      const errors = await validateEmployeeExcel(selectedFile);
      
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
    
    //console.log("Starting import process with client ID:", manualClientId || clientId);
    setIsLoading(true);
    try {
      // Use the manually entered clientId or fall back to the prop
      const effectiveClientId = manualClientId || clientId;
      //console.log("Using effective client ID for import:", effectiveClientId);
      
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
  
  // Function to programmatically click the file input
  const triggerFileSelect = () => {
    //console.log("Triggering file selection dialog");
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file-upload">Upload Excel file</Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
              onClick={triggerFileSelect}
            >
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </p>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".xlsx,.xls"
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
                Supported formats: XLSX, XLS
              </p>
            </div>
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
              onClick={() => setIsOpen(false)} 
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
