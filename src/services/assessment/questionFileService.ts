import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/fileTypes';

export interface QuestionFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

export const questionFileService = {
  // Generate file path for question files
  generateFilePath: (
    clientId: string,
    employeeId: string,
    assessmentName: string,
    questionNumber: number,
    fileName: string
  ): string => {
    const sanitizedAssessmentName = assessmentName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${clientId}/${employeeId}/${sanitizedAssessmentName}/question_${questionNumber}/${fileName}`;
  },

  // Upload files for a specific question
  uploadQuestionFiles: async (
    files: FileItem[],
    clientId: string,
    employeeId: string,
    assessmentName: string,
    questionNumber: number
  ): Promise<QuestionFileItem[]> => {
    const uploadPromises = files.map(async (file) => {
      try {
        // Convert base64 to blob
        const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.type });

        // Generate unique file name to avoid conflicts
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${file.name}`;
        const filePath = questionFileService.generateFilePath(
          clientId,
          employeeId,
          assessmentName,
          questionNumber,
          uniqueFileName
        );

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('assessment-question-files')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('assessment-question-files')
          .getPublicUrl(filePath);

        return {
          id: data.id || crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          path: filePath,
          uploadedAt: new Date()
        };
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  },

  // Delete a question file
  deleteQuestionFile: async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage
      .from('assessment-question-files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  // Delete all files for a question
  deleteQuestionFiles: async (
    clientId: string,
    employeeId: string,
    assessmentName: string,
    questionNumber: number
  ): Promise<void> => {
    const sanitizedAssessmentName = assessmentName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const folderPath = `${clientId}/${employeeId}/${sanitizedAssessmentName}/question_${questionNumber}/`;

    // List all files in the question folder
    const { data: files, error: listError } = await supabase.storage
      .from('assessment-question-files')
      .list(folderPath);

    if (listError) {
      console.error('Error listing files for deletion:', listError);
      return;
    }

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${folderPath}${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from('assessment-question-files')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting question files:', deleteError);
        throw new Error(`Failed to delete question files: ${deleteError.message}`);
      }
    }
  },

  // Get download URL for a file
  getFileUrl: (filePath: string): string => {
    const { data } = supabase.storage
      .from('assessment-question-files')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Validate file size (30MB limit)
  validateFileSize: (file: FileItem): boolean => {
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    return file.size <= maxSize;
  },

  // Validate all files in a list
  validateFiles: (files: FileItem[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    files.forEach(file => {
      if (!questionFileService.validateFileSize(file)) {
        errors.push(`${file.name} exceeds 30MB limit`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
};