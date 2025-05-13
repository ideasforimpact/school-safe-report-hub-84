
import React, { useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Imported components
import SubmitterInfoSection from './form-sections/SubmitterInfoSection';
import GrievanceDetailsSection from './form-sections/GrievanceDetailsSection';
import ResolutionSection from './form-sections/ResolutionSection';
import ContactPreferenceSection from './form-sections/ContactPreferenceSection';
import SubmissionSuccessMessage from './form-sections/SubmissionSuccessMessage';

// Form validation hook
import useGrievanceFormValidation from './hooks/useGrievanceFormValidation';

interface FormResponse {
  question: string;
  answer: string;
}

interface GrievanceSubmissionFormProps {
  schoolName?: string;
}

const GrievanceSubmissionForm: React.FC<GrievanceSubmissionFormProps> = ({ 
  schoolName = "School Grievance Portal" 
}) => {
  const navigate = useNavigate();
  const { addSubmission } = useGrievance();
  const { errors, validateForm } = useGrievanceFormValidation();
  
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [preferContact, setPreferContact] = useState('No');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(name, heading, description)) {
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
    addSubmission({
      id: `sub_${Date.now()}`,
      submitterName: name,
      submitterEmail: contactInfo,
      responses: formattedResponses,
      status: 'new',
      needsFollowup: preferContact === 'Yes',
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
  };

  if (isSubmitted) {
    return <SubmissionSuccessMessage />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <SubmitterInfoSection
          name={name}
          setName={setName}
          contactInfo={contactInfo}
          setContactInfo={setContactInfo}
          errors={errors}
        />
        
        <GrievanceDetailsSection
          heading={heading}
          setHeading={setHeading}
          description={description}
          setDescription={setDescription}
          errors={errors}
        />
        
        <ResolutionSection
          resolution={resolution}
          setResolution={setResolution}
        />
        
        <ContactPreferenceSection
          preferContact={preferContact}
          setPreferContact={setPreferContact}
        />
        
        <div className="pt-4">
          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default GrievanceSubmissionForm;
