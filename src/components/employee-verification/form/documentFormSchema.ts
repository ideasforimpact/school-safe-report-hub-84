
import { z } from 'zod';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const documentFormSchema = z.object({
  documentNumber: z.string().superRefine((value, context) => {
    // Make the document number optional only for 'other' document types
    if (context.path.length > 1) {
      // Access the document type through the path
      const documentType = (context.parent as { documentType?: string })?.documentType;
      
      if (documentType === 'other') {
        return; // Always valid for 'other' type (no error)
      }
      
      if (value.length === 0) {
        // Only add an error if it's not an 'other' document type and the value is empty
        context.addIssue({
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
