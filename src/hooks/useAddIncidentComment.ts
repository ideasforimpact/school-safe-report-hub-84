
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileItem } from '@/types/incident';
import { commentFileStorage, StoredFileItem } from '@/utils/commentFileStorage';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';

export interface AddCommentData {
  comment: string;
  documents?: string[] | FileItem[];
}

export const useAddIncidentComment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { getClientId } = useEmployeeAccess();

  const addComment = async (incidentId: string, data: AddCommentData) => {
    setIsLoading(true);
    try {
      console.log('Adding comment with data:', data);

      // Get client ID from employee access hook
      const clientId = getClientId();
      
      if (!clientId) {
        console.error('Could not determine client ID from employee data');
        throw new Error('Could not determine client ID. Please ensure you are logged in properly.');
      }

      console.log('Using client ID:', clientId);

      let storedFiles: StoredFileItem[] = [];
      
      // If we have file data (FileItem array), upload to storage
      if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
        // Check if documents are FileItem objects (have base64 property)
        const fileItems = data.documents.filter((doc): doc is FileItem => 
          typeof doc === 'object' && 'base64' in doc
        );
        
        if (fileItems.length > 0) {
          console.log('Uploading files to storage:', fileItems.length);
          storedFiles = await commentFileStorage.uploadFiles(fileItems, incidentId);
          console.log('Files uploaded successfully:', storedFiles);
        }
      }

      // Call the edge function with file URLs
      const { data: result, error } = await supabase.functions.invoke('add-incident-comment', {
        body: {
          client_id: clientId,
          incident_id: incidentId,
          comment: data.comment,
          documents: storedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            url: file.url,
            path: file.path
          }))
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to add comment: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to add comment');
      }

      console.log('Comment added successfully');
      return { success: true, data: result };

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add comment');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addComment,
    isLoading
  };
};
