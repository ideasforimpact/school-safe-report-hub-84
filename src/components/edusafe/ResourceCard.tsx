
import React from 'react';
import { FileText, Download, Edit, Trash, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EduSafeResource } from '@/types/eduSafeTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { Link } from 'react-router-dom';

interface ResourceCardProps {
  resource: EduSafeResource;
  onView: (resource: EduSafeResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onView }) => {
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
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      deleteResource(resource.id);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start">
          <div className="bg-blue-50 p-3 rounded-lg mr-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-left">{resource.title}</h3>
            <p className="text-sm text-gray-500 mt-1 text-left">{resource.description}</p>
          </div>
        </div>
        
        <div className="mt-4 text-left">
          <div className="text-xs text-gray-500 flex items-center space-x-2 mb-2">
            <span>Type: {resource.file.type.split('/')[1].toUpperCase()}</span>
            <span>•</span>
            <span>{formatFileSize(resource.file.size)}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {resource.category}
            </Badge>
            
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
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between border-t">
        <div className="text-xs text-gray-500 text-left">
          By {resource.uploaderName}
          <br />
          {new Date(resource.uploadDate).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onView(resource)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button size="sm" variant="ghost" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          {canModify && (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                asChild
              >
                <Link to={`/edusafe-resources/edit/${resource.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
