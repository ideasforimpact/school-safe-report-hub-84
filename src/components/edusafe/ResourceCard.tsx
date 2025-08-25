
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
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';

interface ResourceCardProps {
  resource: EduSafeResource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { user } = useAuth();
  const { downloadResource, deleteResource } = useEduSafe();
  const { state: employeeState } = useEmployeeStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
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
    
    // Check if we have a document URL
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
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await deleteResource(resource.id);
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 relative group">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start">
          <div className="bg-blue-50 p-3 rounded-lg mr-3 flex-shrink-0">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-left truncate">{resource.title}</h3>
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
