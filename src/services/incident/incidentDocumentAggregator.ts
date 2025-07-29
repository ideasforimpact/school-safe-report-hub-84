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
      
      // Get comment documents
      const commentDocuments = await this.getCommentDocuments(incidentId);
      
      // Combine and sort by upload date
      const allDocuments = [...incidentDocuments, ...commentDocuments]
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
  }
};