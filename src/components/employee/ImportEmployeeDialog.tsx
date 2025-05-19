
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  clientId?: string;
  onImportSubmit: (file: File) => Promise<void>;
  isLoading: boolean;
}

const ImportEmployeeDialog = ({ 
  isOpen, 
  setIsOpen, 
  clientId,
  onImportSubmit,
  isLoading 
}: ImportEmployeeDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    await onImportSubmit(file);
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Excel File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                File must be Excel format (.xlsx, .xls) with employee details.
              </p>
              {file && (
                <p className="text-sm text-green-600 mt-1">
                  Selected file: {file.name}
                </p>
              )}
            </div>
            
            {/* Display clientId for debugging */}
            {clientId && (
              <div className="text-xs text-gray-500">
                Client ID: {clientId}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
