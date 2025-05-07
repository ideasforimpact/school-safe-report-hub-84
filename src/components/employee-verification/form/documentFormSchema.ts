
import { z } from 'zod';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const documentFormSchema = z.object({
  documentNumber: z.string().superRefine((value, ctx) => {
    // Make the document number optional only for 'other' document types
    if (ctx.path.length > 1) {
      // Access the parent object that contains the document type
      // Use type assertion to avoid the TypeScript error
      const formData = ctx.path.length > 0 
        ? (ctx as any).parent?.data 
        : undefined;
      
      const documentType = formData?.documentType as VerificationDocumentType | undefined;
      
      if (documentType === 'other') {
        return; // Always valid for 'other' type (no error)
      }
      
      if (value.length === 0) {
        // Only add an error if it's not an 'other' document type and the value is empty
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Document number is required',
        });
      }
    }
  }),
  documentImage: z.string().min(1, 'Document image is required'),
  documentType: z.string().optional(), // This is used internally for validation
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
