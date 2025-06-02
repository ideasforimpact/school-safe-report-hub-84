
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/incident';

export interface IncidentDocumentRecord {
  id: string;
  incident_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  storage_url: string;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

class IncidentDocumentService {
  private static instance: IncidentDocumentService;

  static getInstance(): IncidentDocumentService {
    if (!IncidentDocumentService.instance) {
      IncidentDocumentService.instance = new IncidentDocumentService();
    }
    return IncidentDocumentService.instance;
  }

  // Upload a file to storage and save metadata
  async uploadDocument(file: FileItem, incidentId: string): Promise<IncidentDocumentRecord> {
    try {
      // Convert base64 to blob
      const base64Data = file.base64.split(',')[1] || file.base64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });

      // Create unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}_${randomId}`;
      const filePath = `${incidentId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incident-documents')
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('incident-documents')
        .getPublicUrl(filePath);

      // Save metadata to database using direct table insert
      const { data: docData, error: docError } = await supabase
        .from('incident_documents')
        .insert({
          incident_id: incidentId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          storage_url: urlData.publicUrl
        })
        .select()
        .single();

      if (docError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('incident-documents').remove([filePath]);
        throw new Error(`Failed to save document metadata: ${docError.message}`);
      }

      return {
        id: docData.id,
        incident_id: docData.incident_id,
        file_name: docData.file_name,
        file_path: docData.file_path,
        file_size: docData.file_size,
        mime_type: docData.mime_type,
        storage_url: docData.storage_url,
        uploaded_by: docData.uploaded_by,
        created_at: new Date(docData.created_at),
        updated_at: new Date(docData.updated_at)
      };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadDocuments(files: FileItem[], incidentId: string): Promise<IncidentDocumentRecord[]> {
    const uploadPromises = files.map(file => this.uploadDocument(file, incidentId));
    return Promise.all(uploadPromises);
  }

  // Get documents for an incident using direct table query
  async getIncidentDocuments(incidentId: string): Promise<IncidentDocumentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('incident_documents')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch incident documents: ${error.message}`);
      }

      return (data || []).map((doc: any) => ({
        id: doc.id,
        incident_id: doc.incident_id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        storage_url: doc.storage_url,
        uploaded_by: doc.uploaded_by,
        created_at: new Date(doc.created_at),
        updated_at: new Date(doc.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching incident documents:', error);
      throw error;
    }
  }

  // Delete a document using direct table delete
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // First get the document to find the file path
      const { data: docData, error: fetchError } = await supabase
        .from('incident_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      // Delete from storage
      if (docData?.file_path) {
        await supabase.storage
          .from('incident-documents')
          .remove([docData.file_path]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('incident_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        throw new Error(`Failed to delete document: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get download URL for a document
  getDownloadUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('incident-documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Check if file can be previewed
  canPreview(mimeType: string): boolean {
    const type = mimeType?.toLowerCase() || '';
    return type.startsWith('image/') || type === 'application/pdf';
  }

  // Format file size
  formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const incidentDocumentService = IncidentDocumentService.getInstance();
