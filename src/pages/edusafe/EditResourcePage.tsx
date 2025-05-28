import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
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
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { ResourceCategory } from '@/types/eduSafeTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { X } from 'lucide-react';

const EditResourceContent = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { getResourceById, updateResource } = useEduSafe();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const resource = getResourceById(resourceId!);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('posters');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
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
  const canEdit = user?.role === 'saas_owner' || 
                 (resource?.ownerType === 'school' && resource?.uploaderId === user?.id);
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    updateResource(resourceId!, {
      title: title.trim(),
      description: description.trim(),
      category,
      tags
    });
    
    navigate('/edusafe');
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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description of this resource"
                  rows={3}
                />
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
                    <SelectItem value="procedures">Procedures</SelectItem>
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
                  />
                  <Button 
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <div 
                        key={tag} 
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        {tag}
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
                <div className="text-sm text-gray-600 border p-4 rounded-md bg-gray-50">
                  <p className="text-left">{resource.file.name}</p>
                  <p className="text-left text-xs text-gray-500 mt-1">File cannot be changed. Please upload a new resource if you need to change the file.</p>
                </div>
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
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const EditResourcePage = () => {
  return (
    <Layout>
      <EduSafeProvider>
        <EditResourceContent />
      </EduSafeProvider>
    </Layout>
  );
};

export default EditResourcePage;
