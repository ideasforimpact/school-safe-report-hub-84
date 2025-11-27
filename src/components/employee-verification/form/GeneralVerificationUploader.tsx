import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';

interface GeneralUploaderProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  onUpload: (files: FileItem[]) => void;
  isUploading: boolean;
  onCancel: () => void;
}

const GeneralVerificationUploader: React.FC<GeneralUploaderProps> = ({
  files,
  setFiles,
  onUpload,
  isUploading,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Document Image / PDF <span className="text-red-500">*</span>
        </label>

        <ReusableFileUploader
          onFilesChange={setFiles}
          initialFiles={files}
          maxFiles={10}
          maxSize={5}
          maxTotalSize={50}
          allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
          accept="image/*,.pdf"
          showFileList={true}
          disabled={isUploading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={() => onUpload(files)}
          disabled={isUploading || files.length === 0}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeneralVerificationUploader;
