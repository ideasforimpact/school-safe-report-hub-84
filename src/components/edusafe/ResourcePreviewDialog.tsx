
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image } from 'lucide-react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';

interface ResourcePreviewDialogProps {
  resource: EduSafeResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResourcePreviewDialog: React.FC<ResourcePreviewDialogProps> = ({
  resource,
  open,
  onOpenChange,
}) => {
  const { downloadResource } = useEduSafe();

  if (!resource) return null;

  const handleDownload = () => {
    downloadResource(resource);
  };

  const isImage = resource.file.type.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{resource.title}</DialogTitle>
          <DialogDescription>
            {resource.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-left">Document Preview</h4>
            
            {isImage ? (
              <div className="flex justify-center border rounded-md p-4 bg-gray-50">
                <img 
                  src={resource.file.base64}
                  alt={resource.title}
                  className="max-h-[400px] object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border rounded-md p-12 bg-gray-50">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  Preview not available for {resource.file.type.split('/')[1].toUpperCase()} files
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 text-left">
            <h4 className="text-sm font-medium">Document Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">File Name</p>
                <p>{resource.file.name}</p>
              </div>
              <div>
                <p className="text-gray-500">File Size</p>
                <p>{formatFileSize(resource.file.size)}</p>
              </div>
              <div>
                <p className="text-gray-500">File Type</p>
                <p>{resource.file.type}</p>
              </div>
              <div>
                <p className="text-gray-500">Upload Date</p>
                <p>{new Date(resource.uploadDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Uploaded By</p>
                <p>{resource.uploaderName}</p>
              </div>
              <div>
                <p className="text-gray-500">Owner Type</p>
                <p className="capitalize">{resource.ownerType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="text-sm font-medium">Tags & Categories</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {resource.category}
              </Badge>
              
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              
              {resource.ownerType === 'saas' ? (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Global Resource
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  School Resource
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourcePreviewDialog;
