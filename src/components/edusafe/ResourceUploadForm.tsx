import React, { useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { ResourceCategory } from '@/types/eduSafeTypes';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatFileSize } from '@/utils/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface ResourceUploadFormProps {
  onComplete?: () => void;
}

const ResourceUploadForm: React.FC<ResourceUploadFormProps> = ({ onComplete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('posters');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { refreshResources } = useEduSafe();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please upload a file');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!user?.clientId) {
      toast.error('No client ID found. Please contact support.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags));
      formData.append('client_id', user.clientId);
      if (user.id) {
        formData.append('uploaded_by', user.id);
      }

      console.log('Uploading resource with client_id:', user.clientId);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('edusafe-resource-upload', {
        body: formData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to upload resource');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload resource');
      }

      console.log('Resource uploaded successfully:', data.resource);
      toast.success('Resource uploaded successfully');
      
      // Refresh the resources list
      await refreshResources();
      
      if (onComplete) {
        onComplete();
      } else {
        navigate('/edusafe');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload resource');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
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
          <Label htmlFor="file">Upload File</Label>
          
          {file ? (
            <div className="border rounded-md p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-md">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
              <div className="text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">
                  Click to upload
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOCX, or Images up to 10MB
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
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer text-sm font-medium hover:bg-blue-700"
                >
                  Select File
                </label>
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
        <Button 
          type="submit" 
          disabled={!file || !title.trim() || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Resource'}
        </Button>
      </div>
    </form>
  );
};

export default ResourceUploadForm;
