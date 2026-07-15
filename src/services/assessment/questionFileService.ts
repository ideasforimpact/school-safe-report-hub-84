import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types/fileTypes';

export type AttachmentInput = { id: string; name: string; type: string; file?: File; url?: string; path?: string };
export type UploadedAttachment = { id: string; name: string; type: string; url: string; path: string; size?: number };

export interface AttachmentGroup {
  key: string;
  bucket: string;
  attachments: AttachmentInput[];
  templateName?: string;
  questionId?: string;
  assessmentId?: string | number;
}

export interface GroupUploadResult {
  key: string;
  attachments: UploadedAttachment[];
  error?: string;
}

export const questionFileService = {
  // Shared "skip the network call entirely if there's nothing to upload"
  // guard — used everywhere a general/closure/rework attachment array is
  // conditionally uploaded (Draft, Submit, Complete, Rework all repeated
  // this exact `arr.length > 0 ? await uploadX(...) : []` shape).
  uploadIfPresent: async <T, R>(
    attachments: T[] | undefined | null,
    uploadFn: () => Promise<R[]>
  ): Promise<R[]> => {
    if (!attachments || attachments.length === 0) {
      return [];
    }
    return uploadFn();
  },

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

  // Generate file path for an assessment-level attachment (submission or closure)
  // Structure: {clientId}/{employeeId}/{assessmentId}/{fileName}
  generateSubmissionAttachmentFilePath: (
    clientId: string,
    employeeId: string,
    assessmentId: string | number,
    fileName: string
  ): string => {
    return `${clientId}/${employeeId}/${assessmentId}/${fileName}`;
  },

  // Shared low-level upload primitive: takes any number of attachment
  // groups (e.g. one per question, plus one for a general/closure/rework
  // attachment array) and uploads all of them via exactly ONE call to the
  // edge function, regardless of how many groups there are — path
  // generation + authorization happens server-side (the edge function
  // derives clientId/employeeId from the caller's own session), which
  // hands back a short-lived signed upload URL per file, and the actual
  // file bytes then go straight to storage per-file (Supabase storage has
  // no multi-file signed-upload API, so that part stays one PUT per file).
  uploadAttachmentGroups: async (groups: AttachmentGroup[]): Promise<GroupUploadResult[]> => {
    type Pending = { attachment: AttachmentInput; file: File };
    const resultByIdPerGroup = new Map<string, Map<string, UploadedAttachment>>();
    const pendingByGroup = new Map<string, Pending[]>();
    const groupErrors = new Map<string, string>();

    for (const group of groups) {
      const resultById = new Map<string, UploadedAttachment>();
      const pending: Pending[] = [];

      for (const attachment of group.attachments) {
        // Already uploaded (has a real storage path) — reuse the path as-is
        // and (re)derive the public URL from it, the same way employee
        // document uploads do (useDocumentManagement.ts: store the path,
        // compute the URL from it at use-time). The real uploaded path has
        // a server-generated timestamp/index/random-suffix prefix that we
        // can't reproduce client-side, so we never try to regenerate it —
        // only trust the path that's already there. No network call needed.
        if (attachment.path) {
          const { data: urlData } = supabase.storage.from(group.bucket).getPublicUrl(attachment.path);
          resultById.set(attachment.id, {
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            url: urlData.publicUrl,
            path: attachment.path
          });
          continue;
        }

        let fileToUpload = attachment.file;
        if (!fileToUpload && attachment.url && attachment.url.startsWith('blob:')) {
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          fileToUpload = new File([blob], attachment.name, { type: attachment.type });
        }

        if (!fileToUpload) {
          console.warn('Skipping attachment with no file object or valid URL:', attachment);
          continue;
        }

        pending.push({ attachment, file: fileToUpload });
      }

      resultByIdPerGroup.set(group.key, resultById);
      if (pending.length > 0) {
        pendingByGroup.set(group.key, pending);
      }
    }

    if (pendingByGroup.size > 0) {
      const items = groups
        .filter(g => pendingByGroup.has(g.key))
        .map(g => ({
          key: g.key,
          bucket: g.bucket,
          fileNames: pendingByGroup.get(g.key)!.map(p => p.attachment.name),
          templateName: g.templateName,
          questionId: g.questionId,
          assessmentId: g.assessmentId
        }));

      // One network call for every group's pending files, no matter how
      // many groups there are — this is the whole point of this primitive.
      const { data: uploadUrlData, error: uploadUrlError } = await supabase.functions.invoke(
        'generate-assessment-attachment-upload-url',
        { body: { items } }
      );

      if (uploadUrlError || !uploadUrlData?.success) {
        throw new Error(uploadUrlData?.error || uploadUrlError?.message || 'Failed to get upload URLs');
      }

      type ItemResult = { key: string; success: boolean; results?: Array<{ fileName: string; success: boolean; path?: string; token?: string; publicUrl?: string; error?: string }>; error?: string };
      const itemResultsByKey = new Map<string, ItemResult>(
        (uploadUrlData.results as ItemResult[]).map((r) => [r.key, r])
      );

      await Promise.all(
        groups.map(async (group) => {
          const pending = pendingByGroup.get(group.key);
          if (!pending) return;

          const resultById = resultByIdPerGroup.get(group.key)!;
          const itemResult = itemResultsByKey.get(group.key);
          const uploadErrors: string[] = [];

          if (!itemResult?.success || !itemResult.results) {
            uploadErrors.push(itemResult?.error || 'Failed to get upload URLs for this group');
          } else {
            await Promise.all(
              pending.map(async ({ attachment, file }, index) => {
                const fileResult = itemResult.results![index];

                if (!fileResult?.success) {
                  uploadErrors.push(`${attachment.name}: ${fileResult?.error || 'Failed to get upload URL'}`);
                  return;
                }

                const { error } = await supabase.storage
                  .from(group.bucket)
                  .uploadToSignedUrl(fileResult.path!, fileResult.token!, file);

                if (error) {
                  console.error('Supabase upload error:', error);
                  uploadErrors.push(`${attachment.name}: ${error.message}`);
                  return;
                }

                resultById.set(attachment.id, {
                  id: attachment.id,
                  name: attachment.name,
                  type: attachment.type,
                  url: fileResult.publicUrl!,
                  path: fileResult.path!,
                  size: file.size
                });
              })
            );
          }

          if (uploadErrors.length > 0) {
            groupErrors.set(group.key, `Failed to upload ${uploadErrors.length} attachment(s): ${uploadErrors.join('; ')}`);
          }
        })
      );
    }

    return groups.map(group => ({
      key: group.key,
      // Preserve the original attachment order in the result.
      attachments: group.attachments
        .map(a => resultByIdPerGroup.get(group.key)!.get(a.id))
        .filter((a): a is UploadedAttachment => a !== undefined),
      error: groupErrors.get(group.key)
    }));
  },

  // Shared upload routine for assessment-level attachments (submission/closure),
  // parameterized by destination bucket
  uploadAttachmentsToBucket: async (
    bucketName: string,
    attachments: AttachmentInput[],
    clientId: string,
    employeeId: string,
    assessmentId: string | number
  ): Promise<UploadedAttachment[]> => {
    const [result] = await questionFileService.uploadAttachmentGroups([
      { key: 'default', bucket: bucketName, attachments, assessmentId }
    ]);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.attachments;
  },

  // Upload the general (assessment-level) submission attachments to the
  // dedicated assessment-submission-attachments bucket
  uploadSubmissionAttachments: async (
    attachments: AttachmentInput[],
    clientId: string,
    employeeId: string,
    assessmentId: string | number
  ): Promise<UploadedAttachment[]> => {
    return questionFileService.uploadAttachmentsToBucket(
      'assessment-submission-attachments',
      attachments,
      clientId,
      employeeId,
      assessmentId
    );
  },

  // Upload closure attachments to the dedicated assessment-closure-attachments bucket
  uploadClosureAttachments: async (
    attachments: AttachmentInput[],
    clientId: string,
    employeeId: string,
    assessmentId: string | number
  ): Promise<UploadedAttachment[]> => {
    return questionFileService.uploadAttachmentsToBucket(
      'assessment-closure-attachments',
      attachments,
      clientId,
      employeeId,
      assessmentId
    );
  },

  // Upload answer attachments for a specific question, via the same
  // edge-function-issued signed-URL batching as uploadAttachmentsToBucket.
  uploadAnswerAttachments: async (
    attachments: AttachmentInput[],
    clientId: string,
    employeeId: string,
    templateName: string,
    questionId: string
  ): Promise<UploadedAttachment[]> => {
    const [result] = await questionFileService.uploadAttachmentGroups([
      { key: 'default', bucket: 'assessment-question-files', attachments, templateName, questionId }
    ]);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.attachments;
  }
};