
import React, { useRef } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import FileList from '@/components/file/FileList';
import { v4 as uuidv4 } from 'uuid';

interface DocumentFileUploaderProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  onFileUploaded: (base64: string, file?: File) => void;
}

const DocumentFileUploader: React.FC<DocumentFileUploaderProps> = ({ 
  files, 
  setFiles, 
  onFileUploaded 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handlePreviewFile = (file: FileItem) => {
    // Preview logic would go here in a real app
    console.log('Preview file:', file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    
    // Simple file validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      const newFile: FileItem = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64,
      };
      
      setFiles([...files, newFile]);
      
      // Pass the base64 string and original file up to the parent component
      onFileUploaded(base64, file);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 mb-2">Drag and drop file here, or click to select file</p>
        <p className="text-xs text-gray-400">Supported formats: JPG, PNG, PDF • Max file size: 5MB</p>
        <Input 
          id="file-upload" 
          type="file" 
          className="hidden"
          ref={fileInputRef}
          accept="image/*,.pdf"
          onChange={handleFileUpload}
        />
        <Button 
          type="button" 
          variant="outline" 
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </Button>
      </div>
      
      {files.length > 0 && (
        <FileList 
          files={files} 
          onPreviewFile={handlePreviewFile}
          onRemoveFile={handleRemoveFile}
        />
      )}
    </div>
  );
};

export default DocumentFileUploader;
