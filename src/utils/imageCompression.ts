
import { FileItem } from '@/types/incident';

/**
 * Compresses image data to reduce file size while maintaining reasonable quality
 * @param file The file to compress
 * @returns A promise that resolves to the compressed file
 */
export const compressImageData = async (file: FileItem): Promise<FileItem> => {
  // If it's not an image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // For images, compress them
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use lower quality for JPEG
      const quality = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 0.7 : 0.9;
      const compressedBase64 = canvas.toDataURL(file.type, quality);
      
      resolve({
        ...file,
        base64: compressedBase64,
        size: Math.round(compressedBase64.length * 0.75) // Approximate size after compression
      });
    };
    img.src = file.base64;
  });
};
