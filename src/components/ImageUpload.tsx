
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (imageBase64: string | undefined) => void;
  className?: string;
}

const ImageUpload = ({ initialImage, onImageChange, className = '' }: ImageUploadProps) => {
  const [previewImage, setPreviewImage] = useState<string | undefined>(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update preview image when initialImage prop changes
  useEffect(() => {
    setPreviewImage(initialImage);
    setImageError(false);
  }, [initialImage]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImageError(false);
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setIsUploading(false);
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setIsUploading(false);
      alert('Please upload an image smaller than 5MB');
      return;
    }

    // Convert to Base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      onImageChange(base64String);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      setImageError(true);
      alert('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewImage(undefined);
    onImageChange(undefined);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    console.error("Image failed to load:", previewImage);
    setImageError(true);
  };

  return (
    <div className={`w-full ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
      />
      
      {previewImage && !imageError ? (
        <div className="relative w-full">
          <img 
            src={previewImage} 
            alt="Preview" 
            className="w-full h-48 object-contain border rounded-md"
            onError={handleImageError}
          />
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-48 bg-gray-50 cursor-pointer"
          onClick={triggerFileInput}
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload an image</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4" 
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
