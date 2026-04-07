import { IncidentDocument, incidentDocumentService } from './incidentDocumentService';
import { supabase } from '@/integrations/supabase/client';
import { commentFileStorage } from '@/utils/commentFileStorage';

export interface AggregatedDocuments {
  documents: IncidentDocument[];
  totalCount: number;
}

export const incidentDocumentAggregator = {
  async getAllDocuments(incidentId: string): Promise<AggregatedDocuments> {
    try {
      // Get regular incident documents
      const incidentDocuments = await incidentDocumentService.getIncidentDocuments(incidentId);

      // Get incident closure documents
      const closureDocuments = await this.getClosureDocuments(incidentId);
      
      // Get comment documents
      const commentDocuments = await this.getCommentDocuments(incidentId);
      
      // Combine and sort by upload date
      const allDocuments = [...incidentDocuments, ...closureDocuments, ...commentDocuments]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      return {
        documents: allDocuments,
        totalCount: allDocuments.length
      };
    } catch (error) {
      console.error('Error aggregating documents:', error);
      return { documents: [], totalCount: 0 };
    }
  },

  async getCommentDocuments(incidentId: string): Promise<IncidentDocument[]> {
    try {
      const { data: incident, error } = await supabase
        .from('incidents')
        .select('comments')
        .eq('id', incidentId)
        .single();

      if (error || !incident?.comments) return [];

      const commentDocuments: IncidentDocument[] = [];
      
      if (Array.isArray(incident.comments)) {
        incident.comments.forEach((comment: any) => {
          if (comment.files && Array.isArray(comment.files)) {
            comment.files.forEach((file: any) => {
              commentDocuments.push({
                id: file.id || `${comment.id}-${file.name}`,
                name: file.name,
                type: file.type,
                size: file.size || 0,
                url: file.url || commentFileStorage.getDownloadUrl(file.path),
                path: file.path,
                uploadedAt: comment.createdAt || new Date().toISOString(),
                source: 'comment',
                commentId: comment.id
              });
            });
          }
        });
      }

      return commentDocuments;
    } catch (error) {
      console.error('Error fetching comment documents:', error);
      return [];
    }
  },

  async getClosureDocuments(incidentId: string): Promise<IncidentDocument[]> {
    try {
      const { data, error } = await supabase
        .from('incident_closure_attachments' as any)
        .select('id, file_name, file_type, file_size, file_url, storage_path, created_at')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching closure documents:', error);
        return [];
      }

      return (data || []).map((file: any): IncidentDocument => ({
        id: file.id || crypto.randomUUID(),
        name: file.file_name || 'Closure attachment',
        type: file.file_type || 'application/octet-stream',
        size: file.file_size || 0,
        url: file.file_url || '',
        path: file.storage_path || '',
        uploadedAt: file.created_at || new Date().toISOString(),
        source: 'closure',
      }));
    } catch (error) {
      console.error('Error fetching closure documents:', error);
      return [];
    }
  }
};