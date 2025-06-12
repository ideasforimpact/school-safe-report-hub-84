
import { supabase } from '@/integrations/supabase/client';

export const clearAllIncidentDocuments = async (): Promise<{ success: boolean; affectedRows: number }> => {
  try {
    console.log('Clearing all incident documents...');
    
    // First, count how many incidents have documents
    const { data: countData, error: countError } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .not('documents', 'eq', '[]');
    
    if (countError) {
      throw countError;
    }
    
    const affectedRows = countData?.length || 0;
    console.log(`Found ${affectedRows} incidents with documents to clear`);
    
    // Update all incidents to have empty documents array
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ documents: [] })
      .not('documents', 'eq', '[]');
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`Successfully cleared documents from ${affectedRows} incidents`);
    
    return { success: true, affectedRows };
  } catch (error) {
    console.error('Error clearing incident documents:', error);
    return { success: false, affectedRows: 0 };
  }
};
