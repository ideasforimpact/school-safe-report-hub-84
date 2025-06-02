
import { useState, useCallback } from 'react';
import { FileItem } from '@/types/incident';
import { incidentDocumentService, IncidentDocumentRecord } from '@/services/incident/incidentDocumentService';
import { toast } from 'sonner';

export const useIncidentDocuments = (incidentId?: string) => {
  const [documents, setDocuments] = useState<IncidentDocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!incidentId) return;

    try {
      setLoading(true);
      const docs = await incidentDocumentService.getIncidentDocuments(incidentId);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  const uploadDocuments = useCallback(async (files: FileItem[]) => {
    if (!incidentId || files.length === 0) return [];

    try {
      setUploading(true);
      const uploadedDocs = await incidentDocumentService.uploadDocuments(files, incidentId);
      
      // Add to local state
      setDocuments(prev => [...uploadedDocs, ...prev]);
      
      toast.success(`${uploadedDocs.length} document(s) uploaded successfully`);
      return uploadedDocs;
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
      return [];
    } finally {
      setUploading(false);
    }
  }, [incidentId]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await incidentDocumentService.deleteDocument(documentId);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast.success('Document deleted successfully');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  }, []);

  const downloadDocument = useCallback((document: IncidentDocumentRecord) => {
    try {
      const link = window.document.createElement('a');
      link.href = document.storage_url;
      link.download = document.file_name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  }, []);

  return {
    documents,
    loading,
    uploading,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    downloadDocument
  };
};
