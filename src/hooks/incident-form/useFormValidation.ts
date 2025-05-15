
import { useState } from 'react';
import { z } from 'zod';

// Define the form validation schema using Zod
const incidentFormSchema = z.object({
  type: z.string().min(1, { message: "Incident type is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  locationId: z.string().min(1, { message: "Location is required" }),
  categoryId: z.string().min(1, { message: "Category is required" }),
  subcategory: z.string().min(1, { message: "Subcategory is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  // Optional fields
  rootCause: z.string().optional(),
  facilityId: z.string().optional(),
  location: z.string().optional(),
  owner: z.string().optional()
});

export type FormData = z.infer<typeof incidentFormSchema>;

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (data: any) => {
    try {
      // Parse the data with the schema
      incidentFormSchema.parse(data);
      // Clear errors if validation passes
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to a more manageable format
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            const fieldName = err.path[0].toString();
            newErrors[fieldName] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error("Unexpected validation error:", error);
      }
      return false;
    }
  };

  return {
    errors,
    validateForm,
    clearErrors: () => setErrors({})
  };
}
