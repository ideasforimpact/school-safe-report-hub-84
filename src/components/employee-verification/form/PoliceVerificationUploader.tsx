import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText } from 'lucide-react';
import { FileItem } from '@/types/fileTypes';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { useToast } from '@/hooks/use-toast';

interface PoliceVerificationUploaderProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  onUpload: (files: FileItem[]) => void;
  isUploading: boolean;
  onCancel: () => void;
}

const PoliceVerificationUploader: React.FC<PoliceVerificationUploaderProps> = ({
  files,
  setFiles,
  onUpload,
  isUploading,
  onCancel,
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadConsentForm = async () => {
    setIsDownloading(true);
    try {
      // File is in public folder, accessible via direct URL
      const filePath = '/consent_form/Consent Letter.pdf';
      const fileName = 'Consent Letter.pdf';
      
      // Fetch the file from public folder
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch consent form: ${response.status} ${response.statusText}`);
      }
      
      // Convert to blob and trigger download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Download Started',
        description: 'Consent form download has been initiated.',
      });
    } catch (error: any) {
      console.error('Error downloading consent form:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download consent form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Document Image / PDF <span className="text-red-500">*</span>
        </label>
        
        {/* Consent Form Download Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-900 font-medium mb-1">
                Missing Consent Form?
              </p>
              <p className="text-blue-800">
                If you haven't included the consent form with your documents, please download it{' '}
                <button
                  type="button"
                  onClick={handleDownloadConsentForm}
                  disabled={isDownloading}
                  className="text-blue-700 hover:text-blue-900 font-semibold underline bg-blue-100 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      here
                    </>
                  ) : (
                    'here'
                  )}
                </button>
                {' '}and upload it along with your other documents.
              </p>
            </div>
          </div>
        </div>
        
        <ReusableFileUploader
          onFilesChange={setFiles}
          initialFiles={files}
          maxFiles={10} // Allow multiple files
          maxSize={5} // 5MB per file (as per original requirement)
          maxTotalSize={50} // 50MB total (allowing for multiple 5MB files)
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

export default PoliceVerificationUploader;


