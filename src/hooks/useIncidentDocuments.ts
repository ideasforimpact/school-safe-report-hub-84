
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
    console.log('Files changed:', files.length);
    setSupportingFiles(files);
  }, []);

  // Upload files and update incident - now requires clientId
  const uploadAndSaveDocuments = useCallback(async (incidentId: string, clientId: string, files: FileItem[]): Promise<IncidentDocument[]> => {
    if (!files.length) return [];
    
    console.log('Starting upload of', files.length, 'files for incident:', incidentId, 'client:', clientId);
    setIsUploading(true);
    
    try {
      // Upload files and update incident in one operation using edge function
      const uploadedDocs = await incidentDocumentService.uploadFilesAndUpdateIncident(incidentId, clientId, files);
      console.log('Files uploaded and incident updated:', uploadedDocs.length);
      
      // Update local state with new documents
      setDocuments(prev => [...prev, ...uploadedDocs]);
      setSupportingFiles([]); // Clear the form files after successful upload
      
      toast.success(`${uploadedDocs.length} file(s) uploaded successfully`);
      console.log('Upload completed successfully');
      return uploadedDocs;
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload files: ' + (error?.message || 'Unknown error'));
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Load documents for an incident
  const loadDocuments = useCallback(async (incidentId: string) => {
    try {
      console.log('Loading documents for incident:', incidentId);
      const docs = await incidentDocumentService.getIncidentDocuments(incidentId);
      console.log('Loaded documents:', docs.length);
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
      console.log('Deleting document:', documentPath, 'for incident:', incidentId);
      await incidentDocumentService.deleteDocument(incidentId, documentPath);
      
      // Update local state
      setDocuments(prev => prev.filter(doc => doc.path !== documentPath));
      
      toast.success('Document deleted successfully');
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document: ' + (error?.message || 'Unknown error'));
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
