
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

// Add the UploadedDocument interface
export interface UploadedDocument {
  name: string;
  type: string;
  uploadedAt: string;
  files: {
    name: string;
    path: string;
    url: string;
    uploadedAt: string;
  }[];
}
