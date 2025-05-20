
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onImportEmployees: (file: File, importClientId?: string) => Promise<void>;
  clientId?: string;
}

const ImportEmployeeDialog = ({ isOpen, setIsOpen, onImportEmployees, clientId }: ImportEmployeeDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualClientId, setManualClientId] = useState<string>(clientId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualClientId(e.target.value);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      // Use the manually entered clientId or fall back to the prop
      const effectiveClientId = manualClientId || clientId;
      await onImportEmployees(selectedFile, effectiveClientId);
      setIsOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error importing file:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to programmatically click the file input
  const triggerFileSelect = () => {
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
                disabled={isLoading}
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
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
