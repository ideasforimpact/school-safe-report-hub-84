
export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  base64?: string;
  uploadedAt?: Date;
  status?: 'uploading' | 'uploaded' | 'error';
}

export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  error?: string;
}
