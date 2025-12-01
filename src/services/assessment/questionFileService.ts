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
  // Sanitize filename for storage
  sanitizeFileName: (fileName: string): string => {
    return fileName
      // Replace spaces with underscores
      .replace(/\s+/g, '_')
      // Replace parentheses with underscores
      .replace(/[()]/g, '_')
      // Replace em dash, en dash, and other special dashes with regular hyphen
      .replace(/[—–]/g, '-')
      // Remove or replace other problematic characters but keep alphanumeric, hyphens, underscores, and periods
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      // Remove multiple consecutive underscores/hyphens
      .replace(/[_-]+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '');
  },

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

  // Generate file path for answer attachments
  // Uses template name to match the existing question file structure
  generateAttachmentFilePath: (
    clientId: string,
    employeeId: string,
    templateName: string,
    questionId: string,
    fileName: string
  ): string => {
    const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-_]/g, '_');
    // Extract question number from questionId if it follows pattern question_X or use questionId directly
    const questionNumber = questionId.match(/question[_-]?(\d+)/)?.[1] || questionId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${clientId}/${employeeId}/${sanitizedTemplateName}/question_${questionNumber}/attachments/${fileName}`;
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

        // Allowed file types: PDF, DOC, DOCX, PNG, JPEG, JPG
        const ALLOWED_FILE_TYPES = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg',
          'image/jpg'
        ];
        const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

        // Validate file before upload
        if (file.size === 0) {
          throw new Error(`File ${file.name} is empty`);
        }

        // Validate file size (10MB limit)
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} exceeds the 10MB size limit. Maximum file size is 10MB.`);
        }

        // Validate file type
        const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
          ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
          throw new Error(`File ${file.name} has an invalid format. Allowed formats: PDF, DOC, DOCX, PNG, JPEG, JPG.`);
        }

        // Generate unique file name to avoid conflicts
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = questionFileService.sanitizeFileName(file.name);
        const uniqueFileName = `${timestamp}_${randomSuffix}_${sanitizedFileName}`;
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
  },

  // Upload answer attachments for a specific question
  // Uses template name to match the existing question file structure
  uploadAnswerAttachments: async (
    attachments: Array<{ id: string; name: string; type: string; file?: File; url?: string }>,
    clientId: string,
    employeeId: string,
    templateName: string,
    questionId: string
  ): Promise<Array<{ id: string; name: string; type: string; url: string; path: string; size?: number }>> => {
    console.log('Starting answer attachment upload...', { 
      attachmentCount: attachments.length, 
      clientId, 
      employeeId, 
      templateName, 
      questionId 
    });

    const uploadedAttachments: Array<{ id: string; name: string; type: string; url: string; path: string; size?: number }> = [];

    for (const attachment of attachments) {
      try {
        // If attachment already has a path/url (already uploaded), skip
        if (attachment.url && attachment.url.startsWith('http')) {
          console.log('Attachment already uploaded, skipping:', attachment.name);
          // Extract path from URL if possible, or use a placeholder
          const existingPath = attachment.url.includes('assessment-question-files') 
            ? attachment.url.split('assessment-question-files/')[1] 
            : `assessment-question-files/${clientId}/${employeeId}/${templateName.replace(/[^a-zA-Z0-9-_]/g, '_')}/question_${questionId}/attachments/${attachment.name}`;
          
          uploadedAttachments.push({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            url: attachment.url,
            path: `assessment-question-files/${existingPath}`
          });
          continue;
        }

        // If we have a File object, upload it
        if (attachment.file) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const sanitizedFileName = questionFileService.sanitizeFileName(attachment.name);
          const uniqueFileName = `${timestamp}_${randomSuffix}_${sanitizedFileName}`;
              const filePath = questionFileService.generateAttachmentFilePath(
                clientId,
                employeeId,
                templateName,
                questionId,
                uniqueFileName
              );

          console.log(`Uploading attachment to path: ${filePath}`);

          const { data, error } = await supabase.storage
            .from('assessment-question-files')
            .upload(filePath, attachment.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload ${attachment.name}: ${error.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('assessment-question-files')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            url: urlData.publicUrl,
            path: filePath,
            size: attachment.file.size
          });

          console.log('Attachment upload completed:', uploadedAttachments[uploadedAttachments.length - 1]);
        } else {
          // If no file object and no URL, this is likely a blob URL - try to fetch it
          if (attachment.url && attachment.url.startsWith('blob:')) {
            try {
              const response = await fetch(attachment.url);
              const blob = await response.blob();
              const file = new File([blob], attachment.name, { type: attachment.type });

              const timestamp = Date.now();
              const randomSuffix = Math.random().toString(36).substring(2, 8);
              const sanitizedFileName = questionFileService.sanitizeFileName(attachment.name);
              const uniqueFileName = `${timestamp}_${randomSuffix}_${sanitizedFileName}`;
              const filePath = questionFileService.generateAttachmentFilePath(
                clientId,
                employeeId,
                templateName,
                questionId,
                uniqueFileName
              );

              console.log(`Uploading attachment from blob URL to path: ${filePath}`);

              const { data, error } = await supabase.storage
                .from('assessment-question-files')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (error) {
                console.error('Supabase upload error:', error);
                throw new Error(`Failed to upload ${attachment.name}: ${error.message}`);
              }

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('assessment-question-files')
                .getPublicUrl(filePath);

              uploadedAttachments.push({
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                url: urlData.publicUrl,
                path: filePath,
                size: file.size
              });

              console.log('Attachment upload from blob completed:', uploadedAttachments[uploadedAttachments.length - 1]);
            } catch (fetchError) {
              console.error('Error fetching blob or uploading:', fetchError);
              throw new Error(`Failed to process ${attachment.name}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
            }
          } else {
            // If no file and no valid URL, skip with warning
            console.warn('Skipping attachment with no file object or valid URL:', attachment);
          }
        }
      } catch (error) {
        console.error('Error processing attachment:', attachment.name, error);
        throw new Error(`Failed to upload ${attachment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('All attachments uploaded successfully:', uploadedAttachments);
    return uploadedAttachments;
  }
};