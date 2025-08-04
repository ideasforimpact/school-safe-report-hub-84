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

export interface UploadFileInput {
  file: File;
  id: string;
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

  // Upload files for a specific question using File objects directly
  uploadQuestionFiles: async (
    uploadInputs: UploadFileInput[],
    clientId: string,
    employeeId: string,
    assessmentName: string,
    questionNumber: number
  ): Promise<QuestionFileItem[]> => {
    console.log('Starting file upload process...', { 
      fileCount: uploadInputs.length, 
      clientId, 
      employeeId, 
      assessmentName, 
      questionNumber 
    });

    const uploadPromises = uploadInputs.map(async ({ file, id }) => {
      try {
        console.log(`Processing file: ${file.name}`, { 
          size: file.size, 
          type: file.type 
        });

        // Validate file before upload
        if (file.size === 0) {
          throw new Error(`File ${file.name} is empty`);
        }

        if (file.size > 30 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 30MB limit`);
        }

        // Generate unique file name to avoid conflicts
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const uniqueFileName = `${timestamp}_${randomSuffix}_${file.name}`;
        const filePath = questionFileService.generateFilePath(
          clientId,
          employeeId,
          assessmentName,
          questionNumber,
          uniqueFileName
        );

        console.log(`Uploading to path: ${filePath}`);

        // Upload File object directly to Supabase storage
        const { data, error } = await supabase.storage
          .from('assessment-question-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        console.log('Upload successful:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('assessment-question-files')
          .getPublicUrl(filePath);

        const result = {
          id: id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          path: filePath,
          uploadedAt: new Date()
        };

        console.log('File upload completed:', result);
        return result;
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', results);
      return results;
    } catch (error) {
      console.error('Error in batch upload:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  uploadQuestionFilesLegacy: async (
    files: FileItem[],
    clientId: string,
    employeeId: string,
    assessmentName: string,
    questionNumber: number
  ): Promise<QuestionFileItem[]> => {
    const uploadInputs: UploadFileInput[] = files.map(file => ({
      file: new File([file.base64], file.name, { type: file.type }),
      id: file.id
    }));
    
    return questionFileService.uploadQuestionFiles(
      uploadInputs,
      clientId,
      employeeId,
      assessmentName,
      questionNumber
    );
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