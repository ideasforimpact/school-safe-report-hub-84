
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
    
    // Open the file in a new tab
    if (resource.file.base64) {
      const newWindow = window.open();
      if (newWindow) {
        const isImage = resource.file.type.startsWith('image/');
        const isPdf = resource.file.type === 'application/pdf';
        
        newWindow.document.write(`
          <html>
            <head>
              <title>${resource.title}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f0f2f5; }
                img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                iframe { width: 100%; height: 90vh; border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; text-align: center; }
                .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #333; }
                .description { color: #666; margin-bottom: 10px; }
                .file-info { font-size: 12px; color: #999; }
                .content-wrapper { max-width: 900px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
              </style>
            </head>
            <body>
              <div class="content-wrapper">
                <div class="header">
                  <div class="title">${resource.title}</div>
                  <div class="description">${resource.description}</div>
                  <div class="file-info">File: ${resource.file.name} | Size: ${(resource.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                ${isImage 
                  ? `<img src="${resource.file.base64}" alt="${resource.title}" />`
                  : isPdf 
                  ? `<iframe src="${resource.file.base64}"></iframe>`
                  : `<div style="text-align: center; padding: 50px;">
                       <p>Preview not available for this file type.</p>
                       <p>Please download the file to view it.</p>
                     </div>`
                }
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
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
            <span>Type: {resource.file.type.split('/')[1]?.toUpperCase() || 'PDF'}</span>
            <span>•</span>
            <span>{formatFileSize(resource.file.size || 0)}</span>
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
