
import React, { useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Phone, MessageSquare, FileText, HelpCircle } from 'lucide-react';

interface FormResponse {
  question: string;
  answer: string;
}

interface GrievanceSubmissionFormProps {
  formId?: string;
  schoolName?: string;
}

const GrievanceSubmissionForm: React.FC<GrievanceSubmissionFormProps> = ({ formId, schoolName = "School Grievance Portal" }) => {
  const navigate = useNavigate();
  const { forms, addSubmission } = useGrievance();
  
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [preferContact, setPreferContact] = useState('No');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Use the default form if formId is not provided
  const form = formId ? forms.find(f => f.id === formId) : forms[0];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!heading.trim()) newErrors.heading = 'Grievance heading is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields correctly"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Format responses for submission
    const formattedResponses: FormResponse[] = [
      { question: 'Name', answer: name },
      { question: 'Contact Information', answer: contactInfo },
      { question: 'Grievance Heading', answer: heading },
      { question: 'Description of Grievance', answer: description },
      { question: 'Desired Resolution', answer: resolution },
      { question: 'Contact for Follow-up', answer: preferContact }
    ];
    
    // Add submission
    if (form) {
      addSubmission({
        id: `sub_${Date.now()}`,
        formId: form.id,
        formTitle: form.title,
        submitterName: name,
        submitterEmail: contactInfo,
        responses: formattedResponses,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Show success
      toast({
        title: "Success",
        description: "Your grievance has been submitted. Thank you."
      });
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Wait briefly to show success message before redirecting
      setTimeout(() => {
        navigate('/grievances/thank-you');
      }, 2000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Thank You</h2>
        <p className="text-gray-700 mb-6">
          Your grievance has been submitted successfully. You will be contacted if you requested follow-up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-gray-500" />
          <Label htmlFor="name" className="text-lg font-medium">Name of the Person Raising the Complaint <span className="text-red-500">*</span></Label>
        </div>
        <div>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="Your name will be kept highly confidential"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-5 w-5 text-gray-500" />
          <Label htmlFor="contactInfo">Contact Information</Label>
        </div>
        <div>
          <Input
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Email or phone number (only if follow-up is required)"
          />
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <Label htmlFor="heading">Grievance Heading <span className="text-red-500">*</span></Label>
        </div>
        <div>
          <Input
            id="heading"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className={errors.heading ? 'border-red-500' : ''}
            placeholder="Brief title or subject of your grievance"
          />
          {errors.heading && <p className="text-sm text-red-500 mt-1">{errors.heading}</p>}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <Label htmlFor="description">Description of your grievance <span className="text-red-500">*</span></Label>
        </div>
        <div>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about your grievance"
            className={errors.description ? 'border-red-500' : ''}
            rows={5}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-gray-500" />
          <Label htmlFor="resolution">What action or resolution do you expect?</Label>
        </div>
        <div>
          <Textarea
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Please describe the resolution you are seeking"
            rows={3}
          />
        </div>
        
        <div className="pt-4">
          <div className="flex items-center space-x-2 mb-4">
            <RadioGroup 
              value={preferContact} 
              onValueChange={setPreferContact}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="contact-yes" />
                <Label htmlFor="contact-yes" className="font-normal">I would like to be contacted about this grievance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="contact-no" />
                <Label htmlFor="contact-no" className="font-normal">No follow-up needed</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default GrievanceSubmissionForm;
