
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
import { Download, FileText, Image, Play } from 'lucide-react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtubeUtils';
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
  const [resolvedUrl, setResolvedUrl] = React.useState<string>('');

  if (!resource) return null;

  const handleDownload = () => {
    downloadResource(resource);
  };

  // Resolve storage URL when resource or dialog opens
  React.useEffect(() => {
    if (!resource) {
      setResolvedUrl('');
      return;
    }

    // Check for base64 first
    if (resource.file?.base64) {
      setResolvedUrl(resource.file.base64);
      return;
    }

    // Check for document_url
    if (resource.document_url) {
      const documentUrl = resource.document_url;

      // Check if it's a relative storage path (starts with edusafe-resources/ or /edusafe-resources/)
      if (documentUrl.startsWith('edusafe-resources/') || documentUrl.startsWith('/edusafe-resources/')) {
        // Prepend the Supabase storage base URL
        const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL ;
        const normalizedBase = base.replace(/\/$/, '');
        const normalizedPath = documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`;
        setResolvedUrl(`${normalizedBase}${normalizedPath}`);
      } else {
        // It's already a full URL, use it directly
        setResolvedUrl(documentUrl);
      }
    } else {
      setResolvedUrl('');
    }
  }, [resource, open]);

  // Determine file type from document_url or file data
  const getFileType = () => {
    if (resource.document_url) {
      const fileExtension = resource.document_url.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
        return 'image';
      } else if (fileExtension === 'pdf') {
        return 'pdf';
      } else {
        return 'other';
      }
    } else if (resource.file?.type) {
      if (resource.file.type.startsWith('image/')) {
        return 'image';
      } else if (resource.file.type === 'application/pdf') {
        return 'pdf';
      } else {
        return 'other';
      }
    }
    return 'other';
  };

  const fileType = getFileType();
  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';
  
  // Check if this is a YouTube resource
  const isYouTubeResource = resource.category === 'youtube' && resource.youtube_link;
  const youtubeVideoId = isYouTubeResource ? extractYouTubeVideoId(resource.youtube_link) : null;
  const youtubeEmbedUrl = youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null;

  // Get the source URL for display
  const getSourceUrl = () => {
    return resolvedUrl || resource.file?.base64 || resource.document_url || '';
  };

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
            <h4 className="text-sm font-medium text-left">
              {isYouTubeResource ? 'Video Preview' : 'Document Preview'}
            </h4>
            
            {isYouTubeResource && youtubeEmbedUrl ? (
              <div className="flex justify-center border rounded-md p-4 bg-gray-50">
                <div className="w-full">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={resource.title}
                    className="w-full h-[400px] border-0 rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={() => {
                      console.error('Error loading YouTube video');
                    }}
                  />
                  <div className="mt-2 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(resource.youtube_link, '_blank', 'noopener,noreferrer')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch on YouTube
                    </Button>
                  </div>
                </div>
              </div>
            ) : isImage ? (
              <div className="flex justify-center border rounded-md p-4 bg-gray-50">
                <img 
                  src={getSourceUrl()}
                  alt={resource.title}
                  className="max-h-[400px] object-contain"
                />
              </div>
            ) : isPdf ? (
              <div className="flex justify-center border rounded-md p-4 bg-gray-50">
                <div className="w-full">
                  <iframe
                    src={getSourceUrl()}
                    title={resource.title}
                    className="w-full h-[400px] border-0"
                    onError={() => {
                      console.error('Error loading PDF');
                    }}
                  />
                  <div className="mt-2 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(getSourceUrl(), '_blank', 'noopener,noreferrer')}
                    >
                      Open in new tab
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border rounded-md p-12 bg-gray-50">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  Preview not available for {fileType.toUpperCase()} files
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
            <h4 className="text-sm font-medium">
              {isYouTubeResource ? 'Video Information' : 'Document Information'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {isYouTubeResource ? (
                <>
                  <div>
                    <p className="text-gray-500">Video Title</p>
                    <p>{resource.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">YouTube Link</p>
                    <p className="truncate">
                      <a 
                        href={resource.youtube_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {resource.youtube_link}
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Video ID</p>
                    <p>{youtubeVideoId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Resource Type</p>
                    <p>YouTube Video</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500">File Name</p>
                    <p>{resource.file?.name || resource.document_url?.split('/').pop()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">File Size</p>
                    <p>{formatFileSize(resource.file?.size || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">File Type</p>
                    <p>{resource.file?.type || fileType.toUpperCase()}</p>
                  </div>
                </>
              )}
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
          {isYouTubeResource ? (
            <Button onClick={() => window.open(resource.youtube_link, '_blank', 'noopener,noreferrer')}>
              <Play className="h-4 w-4 mr-2" />
              Watch on YouTube
            </Button>
          ) : (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourcePreviewDialog;
