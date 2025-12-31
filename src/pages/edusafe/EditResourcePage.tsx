
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, FileText, Upload, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { ResourceCategory, EduSafeResource } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { EDUSAFE_DESCRIPTION_MAX_LENGTH, EDUSAFE_TAG_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/constants';

const EditResourceContent = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { getResourceById, updateResource, loading, refreshResources } = useEduSafe();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const resource = getResourceById(resourceId!);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('posters');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Load resource data when component mounts
  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setDescription(resource.description);
      setCategory(resource.category);
      setTags(resource.tags);
    }
  }, [resource]);
  
  // Check if user has permission to edit
  // Allow editing if:
  // 1. User is saas_owner, OR
  // 2. Resource is organisational (school-owned) and user belongs to the same client, OR
  // 3. User is the original uploader
  const canEdit = user?.role === 'saas_owner' || 
                 (resource?.ownerType === 'school' && resource?.resourceType === 'Organisational Resource' && resource?.clientId === user?.clientId) ||
                 (resource?.ownerType === 'school' && resource?.uploaderId === user?.id);
  
  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" className="mr-4">
            <Link to="/edusafe">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!resource) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Resource Not Found</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          The resource you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/edusafe">Return to Resources</Link>
        </Button>
      </div>
    );
  }
  
  if (!canEdit) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Access Denied</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          You don't have permission to edit this resource.
        </p>
        <Button asChild>
          <Link to="/edusafe">Return to Resources</Link>
        </Button>
      </div>
    );
  }
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF, DOCX, or image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    setIsUploading(true);
    
    try {
      if (file) {
        await updateResource(resourceId!, {
          title: title.trim(),
          description: description.trim(),
          category,
          tags,
          file: file
        });
      } else {
        await updateResource(resourceId!, {
          title: title.trim(),
          description: description.trim(),
          category,
          tags
        });
      }
      
      // Refresh resources to get the updated file name
      await refreshResources();
      
      // Clear the selected file since it's been uploaded
      setFile(null);
      
      toast.success('Resource updated successfully');
      navigate('/edusafe');
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center mb-8">
        <Button asChild variant="ghost" className="mr-4">
          <Link to="/edusafe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-left">Edit Resource</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resource title"
                  maxLength={TITLE_MAX_LENGTH}
                  required
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                  {title.length}/{TITLE_MAX_LENGTH} characters
                </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description of this resource"
                  maxLength={EDUSAFE_DESCRIPTION_MAX_LENGTH}
                  rows={3}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                  {description.length}/{EDUSAFE_DESCRIPTION_MAX_LENGTH} characters
                </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as ResourceCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posters">Posters</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="guidelines">Guidelines</SelectItem>
                    <SelectItem value="forms">Forms</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags"
                    onKeyDown={handleKeyDown}
                    maxLength={EDUSAFE_TAG_MAX_LENGTH}
                  />
                  <Button 
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {tagInput.length}/{EDUSAFE_TAG_MAX_LENGTH} characters
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <div 
                        key={tag} 
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center max-w-full break-all"
                      >
                         <span className="truncate max-w-[200px]">
                            {tag}
                          </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>File</Label>
                {file ? (
                  <div className="border-2 border-dashed border-green-300 rounded-md p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{file.name}</p>
                          <p className="text-xs text-green-700">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resource.document_url && (
                      <div className="border-2 border-dashed border-green-300 rounded-md p-4 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">{resource.file.name}</p>
                              {resource.file.size > 0 ? (
                                <p className="text-xs text-green-700">
                                  {(resource.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              ) : (
                                <p className="text-xs text-green-700">
                                  File uploaded
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          Click to upload new file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOCX, or Images up to 10MB
                        </p>
                        <p className="text-xs text-gray-500 mt-1 mb-3">
                          Upload a new file to replace the current one. The old file will be kept in storage.
                        </p>
                        <input
                          id="file"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="file"
                          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Select New File
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/edusafe')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function EditResourcePage() {
  return (
    <Layout>
      <EduSafeProvider>
        <EditResourceContent />
      </EduSafeProvider>
    </Layout>
  );
}
