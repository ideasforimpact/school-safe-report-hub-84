
import { z } from 'zod';

export const documentFormSchema = z.object({
  documentNumber: z.string().optional(),
  documentImage: z.string().min(1, 'Document image is required'),
  dateOfBirth: z.string().optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
