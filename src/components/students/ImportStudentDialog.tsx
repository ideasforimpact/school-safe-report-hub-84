
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportStudents: (file: File) => Promise<void>;
  clientId: string | null;
}

const ImportStudentDialog = ({ 
  open, 
  onOpenChange,
  onImportStudents,
  clientId
}: ImportStudentDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Check if file type is Excel or CSV
    if (fileExtension !== 'xlsx' && fileExtension !== 'csv') {
      toast.error('Please select an Excel (.xlsx) or CSV file');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if file size is less than 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    if (!clientId) {
      toast.error('Client ID is required for import');
      return;
    }

    setIsLoading(true);

    try {
      await onImportStudents(selectedFile);
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isLoading) {
        onOpenChange(newOpen);
        // Reset state when dialog is closed
        if (!newOpen) {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file containing student records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Excel File
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.csv"
              className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              File must be .xlsx or .csv format, under 5MB in size.
            </p>
          </div>
          
          {selectedFile && (
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="text-sm">
                <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Import'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStudentDialog;
