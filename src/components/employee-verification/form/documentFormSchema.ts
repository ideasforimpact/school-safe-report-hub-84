
import { z } from 'zod';

export const documentFormSchema = z.object({
  documentNumber: z.string().min(1, 'Document number is required'),
  documentImage: z.string().min(1, 'Document image is required'),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
