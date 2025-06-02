
import { useState, useCallback } from 'react';
import { FileItem } from '@/types/fileTypes';
import { incidentDocumentService, IncidentDocument } from '@/services/incident/incidentDocumentService';
import { toast } from 'sonner';

export const useIncidentDocuments = (incidentId?: string) => {
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  const [documents, setDocuments] = useState<IncidentDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection for upload
  const handleFilesChange = useCallback((files: FileItem[]) => {
    setSupportingFiles(files);
  }, []);

  // Upload files and update incident
  const uploadAndSaveDocuments = useCallback(async (incidentId: string, files: FileItem[]): Promise<IncidentDocument[]> => {
    if (!files.length) return [];
    
    setIsUploading(true);
    try {
      // Upload files to storage
      const uploadedDocs = await incidentDocumentService.uploadFiles(incidentId, files);
      
      // Get existing documents
      const existingDocs = await incidentDocumentService.getIncidentDocuments(incidentId);
      
      // Combine existing and new documents
      const allDocuments = [...existingDocs, ...uploadedDocs];
      
      // Update incident with all documents
      await incidentDocumentService.updateIncidentDocuments(incidentId, allDocuments);
      
      setDocuments(allDocuments);
      setSupportingFiles([]); // Clear the form files after successful upload
      
      toast.success(`${uploadedDocs.length} file(s) uploaded successfully`);
      return uploadedDocs;
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload files');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Load documents for an incident
  const loadDocuments = useCallback(async (incidentId: string) => {
    try {
      const docs = await incidentDocumentService.getIncidentDocuments(incidentId);
      setDocuments(docs);
      return docs;
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
      return [];
    }
  }, []);

  // Delete a document
  const deleteDocument = useCallback(async (incidentId: string, documentPath: string) => {
    try {
      await incidentDocumentService.deleteDocument(incidentId, documentPath);
      
      // Update local state
      setDocuments(prev => prev.filter(doc => doc.path !== documentPath));
      
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  }, []);

  return {
    supportingFiles,
    documents,
    isUploading,
    handleFilesChange,
    uploadAndSaveDocuments,
    loadDocuments,
    deleteDocument
  };
};
