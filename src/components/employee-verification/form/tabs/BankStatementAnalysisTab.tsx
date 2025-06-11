
import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BankStatementAnalysisTabProps {
  employeeId: string;
  onSubmit?: () => void;
}

const BankStatementAnalysisTab: React.FC<BankStatementAnalysisTabProps> = ({ 
  employeeId, 
  onSubmit 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF file only.',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF file only.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'Required Field',
        description: 'Please upload a PDF file for bank statement analysis.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement bank statement analysis submission logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: 'Bank Statement Submitted',
        description: 'Bank statement has been submitted for analysis.',
      });
      
      if (onSubmit) onSubmit();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit bank statement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Bank Statement Analysis</h3>
        <p className="text-gray-600 text-sm">Upload a PDF file of the bank statement for analysis</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : file
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-3">
            <FileText className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Drag PDF file here</p>
              <p className="text-gray-500">or click to browse</p>
            </div>
            <div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Select PDF File
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-red-500 flex items-center">
        <span className="mr-1">*</span>
        PDF file is required for bank statement analysis
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!file || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
        </Button>
      </div>
    </div>
  );
};

export default BankStatementAnalysisTab;
