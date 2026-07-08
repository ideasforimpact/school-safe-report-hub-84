import { IncidentDocument, incidentDocumentService } from './incidentDocumentService';
import { supabase } from '@/integrations/supabase/client';
import { commentFileStorage } from '@/utils/commentFileStorage';

export interface AggregatedDocuments {
  documents: IncidentDocument[];
  totalCount: number;
}

export interface PreloadedIncidentData {
  documents?: Array<Record<string, unknown>> | null;
  comments?: unknown;
}

export const incidentDocumentAggregator = {
  // `preloaded` lets callers that already have the incident row (e.g. the detail
  // page, via fetch-incidents) skip the direct `documents`/`comments` table reads
  // below — only closure documents (always fetched fresh via edge function) and
  // any data not supplied fall back to a direct fetch.
  async getAllDocuments(incidentId: string, preloaded?: PreloadedIncidentData): Promise<AggregatedDocuments> {
    try {
      // Get regular incident documents
      const incidentDocuments = preloaded && 'documents' in preloaded
        ? incidentDocumentService.mapStoredDocuments(preloaded.documents)
        : await incidentDocumentService.getIncidentDocuments(incidentId);

      // Get incident closure documents
      const closureDocuments =
        await incidentDocumentService.fetchClosureDocuments(incidentId);

      // Get comment documents
      const commentDocuments = preloaded && 'comments' in preloaded
        ? this.mapCommentDocuments(preloaded.comments)
        : await this.getCommentDocuments(incidentId);

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

  // Convert an incident's raw `comments` JSON column into the file attachments
  // it carries. Pulled out of getCommentDocuments so preloaded data can reuse it.
  mapCommentDocuments(comments: unknown): IncidentDocument[] {
    const commentDocuments: IncidentDocument[] = [];

    if (Array.isArray(comments)) {
      (comments as Array<Record<string, unknown> & { files?: Array<Record<string, unknown>> }>).forEach((comment) => {
        if (comment.files && Array.isArray(comment.files)) {
          comment.files.forEach((file) => {
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
  },

  async getCommentDocuments(incidentId: string): Promise<IncidentDocument[]> {
    try {
      const { data: incident, error } = await supabase
        .from('incidents')
        .select('comments')
        .eq('id', incidentId)
        .single();

      if (error || !incident?.comments) return [];

      return this.mapCommentDocuments(incident.comments);
    } catch (error) {
      console.error('Error fetching comment documents:', error);
      return [];
    }
  }
};