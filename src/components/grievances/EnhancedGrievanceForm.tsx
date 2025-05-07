
import React, { useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { User, Phone, MessageSquare, FileText, Send, HelpCircle } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface FormResponse {
  question: string;
  answer: string;
}

interface EnhancedGrievanceFormProps {
  schoolName?: string;
}

// Create a schema for form validation
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  contactInfo: z.string().optional(),
  heading: z.string().min(5, {
    message: "Heading must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  resolution: z.string().optional(),
  preferContact: z.enum(["Yes", "No"]),
});

type FormValues = z.infer<typeof formSchema>;

const EnhancedGrievanceForm: React.FC<EnhancedGrievanceFormProps> = ({ schoolName = "School Grievance Portal" }) => {
  const navigate = useNavigate();
  const { addSubmission } = useGrievance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
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

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Format responses for submission
    const formattedResponses: FormResponse[] = [
      { question: 'Name', answer: values.name },
      { question: 'Contact Information', answer: values.contactInfo || 'Not provided' },
      { question: 'Grievance Heading', answer: values.heading },
      { question: 'Description of Grievance', answer: values.description },
      { question: 'Desired Resolution', answer: values.resolution || 'Not specified' },
      { question: 'Contact for Follow-up', answer: values.preferContact }
    ];
    
    // Add submission
    addSubmission({
      id: `sub_${Date.now()}`,
      submitterName: values.name,
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

  return (
    <div className="animate-fade-in">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Name Section */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-medium">Name of the Person Raising the Complaint</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Your name will be kept highly confidential"
                        {...field}
                        className="bg-gray-50 transition-colors focus:bg-white"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-amber-500">•</span> Required field. Your identity will be protected.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-medium">Contact Information</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Email or phone number (only if follow-up is required)"
                        {...field}
                        className="bg-gray-50 transition-colors focus:bg-white"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 mt-1">
                      Optional. Only needed if you want us to contact you about this grievance.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grievance Heading */}
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-medium">Grievance Heading</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Brief title or subject of your grievance"
                        {...field}
                        className="bg-gray-50 transition-colors focus:bg-white"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-amber-500">•</span> Required field. Provide a concise title for your grievance.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-medium">Description of your grievance</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your grievance"
                        className="min-h-[150px] bg-gray-50 transition-colors focus:bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-amber-500">•</span> Required field. Include all relevant details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resolution */}
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-medium">What action or resolution do you expect?</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the resolution you are seeking"
                        className="min-h-[100px] bg-gray-50 transition-colors focus:bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 mt-1">
                      Optional. Tell us what outcome you hope to achieve.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Preference */}
            <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
              <FormField
                control={form.control}
                name="preferContact"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg font-medium">Would you like to be contacted about this grievance?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="contact-yes" />
                          <FormLabel htmlFor="contact-yes" className="font-normal">Yes, please contact me</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id="contact-no" />
                          <FormLabel htmlFor="contact-no" className="font-normal">No follow-up needed</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-center">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-6 text-lg rounded-full bg-gradient-to-r from-primary to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transition-all shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  <span>Submit Grievance</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EnhancedGrievanceForm;
