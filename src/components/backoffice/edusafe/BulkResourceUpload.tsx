import React, { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { FileItem } from '@/types/fileTypes';
import { ResourceCategory } from '@/types/eduSafeTypes';
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';

const BulkResourceUploadInner: React.FC = () => {
  const { addResource } = useEduSafe();
  const [files, setFiles] = useState<FileList | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('policy');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setUploadComplete(false);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!title || !description || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64 = await readFileAsDataURL(file);
          
          const fileItem: FileItem = {
            id: `file_${Date.now()}_${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            base64
          };
          
          // Use file name as part of title if multiple files
          const resourceTitle = files.length > 1 
            ? `${title} - ${file.name}`
            : title;
          
          await addResource({
            title: resourceTitle,
            description,
            category,
            tags: tagArray,
            file: fileItem,
            document_url: fileItem.base64
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} resource${successCount !== 1 ? 's' : ''}`);
        setUploadComplete(true);
        
        // Reset form on success
        setTitle('');
        setDescription('');
        setTags('');
        setFiles(null);
        
        // Reset file input
        const fileInput = document.getElementById('resource-files') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error(`Error during upload: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const categories: ResourceCategory[] = ['posters', 'policy', 'guidelines', 'forms', 'other'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (For all resources)</Label>
            <Input
              id="title"
              placeholder="Enter common title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (For all resources)</Label>
            <Input
              id="description"
              placeholder="Enter common description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category (For all resources)</Label>
            <Select value={category} onValueChange={value => setCategory(value as ResourceCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Comma-separated)</Label>
            <Input
              id="tags"
              placeholder="safety, emergency, policy"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Card className="border-dashed border-2 border-gray-300 h-full">
            <CardContent className="flex flex-col items-center justify-center py-10 h-full">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-center text-gray-500 mb-4">
                {files ? `${files.length} file(s) selected` : 'Drag and drop or click to upload files'}
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="resource-files"
              />
              <label htmlFor="resource-files">
                <Button variant="outline" className="cursor-pointer">
                  Choose files
                </Button>
              </label>
              
              {files && files.length > 0 && (
                <div className="mt-4 w-full max-h-32 overflow-y-auto">
                  <ul className="text-xs text-gray-600">
                    {Array.from(files).map((file, i) => (
                      <li key={i} className="truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={!files || files.length === 0 || !title || !description || uploading}
              >
                {uploading ? "Uploading..." : "Upload Resources"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {uploadComplete && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>Resources successfully uploaded.</span>
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-medium mb-2">Instructions</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Enter common metadata for all resources you're uploading</li>
          <li>Select multiple files to upload them with the same metadata</li>
          <li>File names will be appended to titles when uploading multiple files</li>
          <li>Supported file types: PDF, DOCX, PPTX, PNG, JPEG, etc.</li>
        </ul>
      </div>
    </div>
  );
};

// Wrapper component to ensure EduSafeProvider is available
const BulkResourceUpload: React.FC = () => {
  return (
    <EduSafeProvider>
      <BulkResourceUploadInner />
    </EduSafeProvider>
  );
};

export default BulkResourceUpload;
