
import React from 'react';
import { FileText, Download, Edit, Trash, Eye, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResourceCardProps {
  resource: EduSafeResource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { user } = useAuth();
  const { downloadResource, deleteResource } = useEduSafe();
  
  // Check if the user can edit/delete the resource
  const canModify = user?.role === 'saas_owner' || 
                   (resource.ownerType === 'school' && resource.uploaderId === user?.id);
  
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadResource(resource);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Open the file in a new tab using document_url
    if (resource.document_url) {
      // Open the document URL directly in a new tab
      window.open(resource.document_url, '_blank', 'noopener,noreferrer');
    } else if (resource.file?.base64) {
      // Fallback to base64 if document_url is not available
      window.open(resource.file.base64, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No file available to view');
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      await deleteResource(resource.id);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 relative group">
      {/* Action Menu positioned at top-right */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {canModify && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/edusafe/edit/${resource.id}`} className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4 flex-grow">
        <div className="flex items-start">
          <div className="bg-blue-50 p-3 rounded-lg mr-3 flex-shrink-0">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-left truncate pr-8">{resource.title}</h3>
            <p className="text-sm text-gray-500 mt-1 text-left line-clamp-2">{resource.description}</p>
          </div>
        </div>
        
        <div className="mt-4 text-left">
          <div className="text-xs text-gray-500 flex items-center space-x-2 mb-3">
            <span>Type: PDF</span>
            <span>•</span>
            <span>Unknown size</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
              {resource.category}
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
            By {resource.uploaderName} • {new Date(resource.uploadDate).toLocaleDateString()}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={handleView} className="h-8 px-2">
                <Eye className="h-3 w-3 mr-1" />
                <span className="text-xs">View</span>
              </Button>
              
              <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 px-2">
                <Download className="h-3 w-3 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
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
    </Card>
  );
};

export default ResourceCard;
