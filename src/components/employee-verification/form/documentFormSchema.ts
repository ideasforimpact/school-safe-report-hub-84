
import { z } from 'zod';

export const documentFormSchema = z.object({
  documentNumber: z.string().optional(),
  documentImage: z.string().optional(), // Made optional since bank accounts won't need it
  dateOfBirth: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
