
import { z } from 'zod';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const documentFormSchema = z.object({
  documentNumber: z.string().refine(
    (value, context) => {
      // Make the document number optional only for 'other' document types
      const documentType = context.path[0] === 'documentNumber' && 
                           context.path.length > 1 ? 
                           (context as any)?.parent?.documentType : null;
                           
      if (documentType === 'other') {
        return true; // Always valid for 'other' type
      }
      return value.length > 0; // Required for all other document types
    },
    {
      message: 'Document number is required',
    }
  ),
  documentImage: z.string().min(1, 'Document image is required'),
  documentType: z.string().optional(), // This is used internally for validation
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
