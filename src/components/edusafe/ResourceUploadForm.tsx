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
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [tagError, setTagError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [existingResourceTitles, setExistingResourceTitles] = useState<string[]>([]);
  const [titlesLoading, setTitlesLoading] = useState(true);
  
  const { refreshResources } = useEduSafe();
  const { user } = useAuth();
  const navigate = useNavigate();

  // YouTube URL validation function
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };
  
  // Fetch existing resource titles for duplicate validation
  React.useEffect(() => {
    const fetchExistingTitles = async () => {
      if (!user?.clientId) {
        setTitlesLoading(false);
        return;
      }

      try {
        setTitlesLoading(true);
        console.log('Fetching existing resource titles for client:', user.clientId);

        const { data: resourcesData, error } = await supabase
          .from('edusafe_resources')
          .select('title')
          .eq('client_id', user.clientId);

        if (error) {
          console.error('Error fetching existing resources:', error);
          return;
        }

        const resourceTitles = resourcesData?.map(resource => resource.title.toLowerCase()) || [];
        console.log('Existing resource titles:', resourceTitles);
        setExistingResourceTitles(resourceTitles);
      } catch (error) {
        console.error('Error fetching existing resources:', error);
      } finally {
        setTitlesLoading(false);
      }
    };

    fetchExistingTitles();
  }, [user?.clientId]);
  
  // Function to validate title - only allow letters, numbers, spaces, and basic punctuation
  const validateTitle = (value: string) => {
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validTitleRegex = /^[a-zA-Z0-9\s\-'()]+$/;
    
    if (!validTitleRegex.test(value)) {
      return 'Title can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    
    return '';
  };
  
  // Function to validate tags - only allow letters, numbers, spaces, and basic punctuation
  const validateTag = (value: string) => {
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validTagRegex = /^[a-zA-Z0-9\s\-'()]+$/;
    
    if (!validTagRegex.test(value)) {
      return 'Tags can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    
    return '';
  };
  
  // Handle title change with validation
  const handleTitleChange = (value: string) => {
    setTitle(value);
    let error = validateTitle(value);
    
    // Check for duplicate title
    if (!error && value.trim() && existingResourceTitles.includes(value.toLowerCase().trim())) {
      error = 'A resource with this title already exists. Please choose a different title.';
    }
    
    setTitleError(error);
  };
  
  // Handle tag input change with validation
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    const error = validateTag(value);
    setTagError(error);
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
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      // Validate the tag before adding
      const error = validateTag(tagInput.trim());
      if (error) {
        setTagError(error);
        return;
      }
      
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setTagError(''); // Clear any previous errors
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
    
    // For YouTube category, file is optional but YouTube link is required
    if (category === 'youtube') {
      if (!youtubeLink.trim()) {
        toast.error('Please enter a YouTube link');
        return;
      }
      
      if (!isValidYouTubeUrl(youtubeLink.trim())) {
        toast.error('Please enter a valid YouTube URL');
        return;
      }
    } else {
      // For other categories, file is required
      if (!file) {
        toast.error('Please upload a file');
        return;
      }
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (titleError) {
      toast.error('Please fix the title format');
      return;
    }

    // Check for duplicate resource title
    if (existingResourceTitles.includes(title.toLowerCase().trim())) {
      toast.error('A resource with this title already exists. Please choose a different title.');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
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
      
      // Only append file if it exists (not required for YouTube category)
      if (file) {
        formData.append('file', file);
      }
      
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags));
      formData.append('client_id', user.clientId);
      
      // Add YouTube link if category is YouTube
      if (category === 'youtube' && youtubeLink.trim()) {
        formData.append('youtube_link', youtubeLink.trim());
      }
      
      if (user.id) {
        formData.append('uploaded_by', user.id);
      }

      console.log('Uploading resource with client_id:', user.clientId);
      console.log('Form data being sent:', {
        category,
        hasFile: !!file,
        hasYoutubeLink: !!youtubeLink,
        title: title.trim(),
        clientId: user.clientId
      });

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
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Resource title"
            maxLength={15}
            required
          />
          {titleError && (
            <p className="text-xs text-red-500 mt-1">{titleError}</p>
          )}
          <div className="text-xs text-gray-500 text-right">
            {title.length}/15 characters
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief description of this resource"
            maxLength={100}
            rows={3}
            required
          />
          <div className="text-xs text-gray-500 text-right">
            {description.length}/100 characters
          </div>
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
              <SelectItem value="youtube">YouTube Link</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* YouTube Link Input - Only show when category is 'youtube' */}
        {category === 'youtube' && (
          <div className="space-y-2">
            <Label htmlFor="youtubeLink">
              YouTube Link <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="youtubeLink"
              value={youtubeLink}
              onChange={(e) => {
                setYoutubeLink(e.target.value);
                // Validate YouTube URL
                if (e.target.value.trim() && !isValidYouTubeUrl(e.target.value.trim())) {
                  setYoutubeError('Please enter a valid YouTube URL');
                } else {
                  setYoutubeError('');
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              className={youtubeError ? 'border-red-500' : ''}
            />
            {youtubeError && (
              <p className="text-xs text-red-500 mt-1">{youtubeError}</p>
            )}
            <p className="text-xs text-gray-500">
              Enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex items-center space-x-2">
            <Input 
              id="tags"
              value={tagInput}
              onChange={(e) => handleTagInputChange(e.target.value)}
              placeholder="Add tags"
              onKeyDown={handleKeyDown}
            />
            <Button 
              type="button"
              onClick={handleAddTag}
              variant="outline"
              disabled={!!tagError}
            >
              Add
            </Button>
          </div>
          
          {tagError && (
            <p className="text-xs text-red-500 mt-1">{tagError}</p>
          )}
          
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
        
        {/* File Upload Section - Only show for non-YouTube categories */}
        {category !== 'youtube' && (
          <div className="space-y-2">
            <Label htmlFor="file">
              Upload File <span className="text-red-500">*</span>
            </Label>
          
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
                  required
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
        )}
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
          disabled={
            isUploading || 
            !title.trim() || 
            !description.trim() || 
            !!titleError || 
            !!tagError || 
            !!youtubeError ||
            existingResourceTitles.includes(title.toLowerCase().trim()) ||
            (category === 'youtube' ? !youtubeLink.trim() : !file)
          }
        >
          {isUploading ? 'Uploading...' : 'Upload Resource'}
        </Button>
      </div>
    </form>
  );
};

export default ResourceUploadForm;
