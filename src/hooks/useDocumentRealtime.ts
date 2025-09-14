
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationDocument } from '@/types/employeeVerification';

type DocumentUpdateCallback = (updatedDocument: VerificationDocument) => void;

export const useDocumentRealtime = (
  employeeId: string,
  onDocumentUpdate: DocumentUpdateCallback
) => {
  useEffect(() => {
    // Create a channel subscription to listen for changes on employee_documents table
    const channel = supabase
      .channel('employee-documents-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employee_documents',
          filter: `employee_id=eq.${employeeId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.new) {
            // Transform the database record to our frontend format
            const updatedDoc: VerificationDocument = {
              id: payload.new.id,
              employeeId: payload.new.employee_id,
              documentTypeId: payload.new.document_type_id,
              documentNumber: payload.new.document_number || '',
              documentImage: payload.new.document_url ? 
                (() => {
                  if (payload.new.document_url) {
                    const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL || 'https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public';
                    const normalizedBase = base.replace(/\/$/, '');
                    return `${normalizedBase}/employee-documents/${payload.new.document_url}`;
                  }
                  return '';
                })(),
              verificationStatus: payload.new.verification_status as any || 'pending',
              documentStatusId: payload.new.document_status_id,
              employee_docs_log: payload.new.employee_docs_log || [],
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at
            };
            
            // Call the callback with the updated document
            onDocumentUpdate(updatedDoc);
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  }, [employeeId, onDocumentUpdate]);
};
