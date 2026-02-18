
import React from 'react';
import { FileText, Download, Edit, Trash, Eye, Play } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '@/utils/youtubeUtils';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { Link } from 'react-router-dom';
import ResourcePreviewDialog from '@/components/edusafe/ResourcePreviewDialog';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { formatDate } from '@/lib/Dateformat';

interface ResourceCardProps {
  resource: EduSafeResource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { user } = useAuth();
  const { downloadResource, deleteResource } = useEduSafe();
  const { state: employeeState } = useEmployeeStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  
  // Check if user has super admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  // Check if user has edu resources admin access
  const hasEduResourcesAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    const eduResourcesModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'edu resources' || 
                module.name.toLowerCase() === 'edusafe' ||
                module.name.toLowerCase() === 'edusafe resources'
    );
    
    return eduResourcesModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, employeeState.configuredModules]);
  
  // Check if the user can edit/delete the resource
  // Global Resources cannot be edited/deleted by regular users (only by backoffice)
  const canModify = (hasEduResourcesAdmin || 
                   (resource.ownerType === 'school' && resource.uploaderId === user?.id)) &&
                   resource.resourceType !== 'Global Resource';
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await downloadResource(resource);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle YouTube resources
    if (isYouTubeResource && resource.youtube_link) {
      window.open(resource.youtube_link, '_blank', 'noopener,noreferrer');
      return;
    }
    
    try {
      let urlToOpen: string | null = null;

     
      // Check for document_url
       if (resource.document_url) {
        const documentUrl = resource.document_url;
        
        // Check if it's a relative storage path (starts with edusafe-resources/ or /edusafe-resources/)
        if (documentUrl.startsWith('edusafe-resources/') || documentUrl.startsWith('/edusafe-resources/')) {
          // Prepend the Supabase storage base URL
          const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL 
          const normalizedBase = base.replace(/\/$/, '');
          const normalizedPath = documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`;
          urlToOpen = `${normalizedBase}${normalizedPath}`;
        } else {
          // It's already a full URL, use it directly
          urlToOpen = documentUrl;
        }
      }

      if (urlToOpen) {
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No file available to view');
      }
    } catch (error) {
      console.error('[ResourceCard] Error opening document:', error);
      toast.error('Failed to open document');
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await deleteResource(resource.id);
    setShowDeleteConfirm(false);
  };

  // Check if this is a YouTube resource
  const isYouTubeResource = resource.category === 'youtube' && resource.youtube_link;
  const youtubeVideoId = isYouTubeResource ? extractYouTubeVideoId(resource.youtube_link) : null;
  const youtubeThumbnail = youtubeVideoId ? getYouTubeThumbnail(youtubeVideoId, 'medium') : null;
  console.log(isYouTubeResource,"isYouTubeResource",resource);
  
  // Debug logging for YouTube resources
  if (isYouTubeResource) {
    console.log('YouTube Resource Debug:', {
      category: resource.category,
      youtube_link: resource.youtube_link,
      youtubeVideoId,
      youtubeThumbnail,
      isYouTubeResource
    });
  }
  const getEmployeeTypeDisplay = (type?: string) => {
    if (!type) return 'Not Specified';
    
    return type.charAt(0).toUpperCase()  + type.slice(1);;
  };


  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 relative group">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start">
          {isYouTubeResource ? (
            <div className="relative mr-3 flex-shrink-0">
              {youtubeThumbnail ? (
                <div className="relative w-16 h-12 rounded-lg overflow-hidden">
                  <img 
                    src={youtubeThumbnail} 
                    alt={`${resource.title} thumbnail`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide image and show fallback
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.youtube-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="youtube-fallback bg-red-50 p-3 rounded-lg w-full h-full items-center justify-center hidden absolute inset-0">
                    <Play className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-60 rounded-full p-1">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-lg w-16 h-12 flex items-center justify-center">
                  <Play className="h-6 w-6 text-red-600" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded-lg mr-3 flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-left truncate">{resource.title}</h3>
            <p className="text-sm text-gray-500 mt-1 text-left line-clamp-2">{resource.description}</p>
          </div>
        </div>

        
        <div className="mt-4 text-left">
          <div className="text-xs text-gray-500 flex items-center space-x-2 mb-3">
            <span>Type: {isYouTubeResource ? 'YouTube Video' : 'PDF'}</span>
            <span>•</span>
            <span>{isYouTubeResource ? 'Video' : 'Unknown size'}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
              {getEmployeeTypeDisplay(resource.category)}
            </Badge>
            
            <Badge 
              variant="outline" 
              className={
                resource.resourceType === 'Global Resource' 
                  ? "bg-purple-50 text-purple-700 text-xs" 
                  : "bg-green-50 text-green-700 text-xs"
              }
            >
              {resource.resourceType}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t bg-gray-50/50">
        <div className="w-full">
          <div className="text-xs text-gray-500 text-left mb-2">
            By {resource.uploaderName} •{" "}
            {resource.uploadDate && formatDate(resource.uploadDate)}
          </div>

          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {isYouTubeResource ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleView} 
                  className="h-8 px-2"
                >
                  <Play className="h-3 w-3 mr-1" />
                  <span className="text-xs">Watch</span>
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={handleView} className="h-8 px-2">
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
                  
                  <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 px-2">
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                </>
              )}
            </div>

            {canModify && (
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link to={`/edusafe/edit/${resource.id}`}>
                    <Edit className="h-3 w-3" />
                  </Link>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardFooter>
      <ResourcePreviewDialog
        resource={resource}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
      
      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <Trash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Resource</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-medium">{resource.title}</span>"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="px-4 py-2"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResourceCard;
