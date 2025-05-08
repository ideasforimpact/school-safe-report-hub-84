import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FormResponse } from '@/contexts/grievances/types';

// Form schema for validation
export const formSchema = z.object({
  name: z.string().optional(),
  contactInfo: z.string().optional(),
  heading: z.string().optional(),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  resolution: z.string().optional(),
  preferContact: z.enum(["Yes", "No"]),
}).refine(data => {
  // If preferContact is Yes, contactInfo is required
  if (data.preferContact === "Yes" && (!data.contactInfo || data.contactInfo.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Contact information is required when you select 'Yes' for follow-up",
  path: ["contactInfo"],
});

export type EnhancedGrievanceFormValues = z.infer<typeof formSchema>;

export function useEnhancedGrievanceForm(schoolName: string) {
  const navigate = useNavigate();
  const { addSubmission } = useGrievance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<EnhancedGrievanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactInfo: "",
      heading: "",
      description: "",
      resolution: "",
      preferContact: "No",
    },
  });

  const onSubmit = (values: EnhancedGrievanceFormValues) => {
    setIsSubmitting(true);
    
    // Format responses for submission
    const formattedResponses: FormResponse[] = [
      { question: 'Name', answer: values.name || 'Anonymous' },
      { question: 'Contact Information', answer: values.contactInfo || 'Not provided' },
      { question: 'Grievance Heading', answer: values.heading || 'No heading provided' },
      { question: 'Description of Grievance', answer: values.description },
      { question: 'Desired Resolution', answer: values.resolution || 'Not specified' },
      { question: 'Contact for Follow-up', answer: values.preferContact }
    ];
    
    // Add submission
    addSubmission({
      id: `sub_${Date.now()}`,
      submitterName: values.name || 'Anonymous',
      submitterEmail: values.contactInfo || '',
      responses: formattedResponses,
      status: 'new',
      needsFollowup: values.preferContact === 'Yes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Show success
    toast({
      title: "Success",
      description: "Your grievance has been submitted. Thank you."
    });
    
    setIsSubmitting(false);
    
    // Navigate to thank you page
    setTimeout(() => {
      navigate('/grievances/thank-you');
    }, 1500);
  };

  return {
    form,
    isSubmitting,
    onSubmit
  };
}
