
import React, { useEffect, useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface FormResponse {
  question: string;
  answer: string;
}

interface GrievanceSubmissionFormProps {
  formId?: string;
}

const GrievanceSubmissionForm: React.FC<GrievanceSubmissionFormProps> = ({ formId }) => {
  const navigate = useNavigate();
  const { forms, addSubmission } = useGrievance();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [grievanceType, setGrievanceType] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [previouslyReported, setPreviouslyReported] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [keepConfidential, setKeepConfidential] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Use the default form if formId is not provided
  const form = formId ? forms.find(f => f.id === formId) : forms[0];

  useEffect(() => {
    // Redirect if form is not found or not active
    if (!form || !form.isActive) {
      toast({
        variant: "destructive",
        title: "Form Not Available",
        description: "This form is not available or has been deactivated."
      });
      navigate('/');
    }
  }, [form, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Valid email is required';
    if (!role) newErrors.role = 'Role is required';
    if (!grievanceType) newErrors.grievanceType = 'Grievance type is required';
    if (!incidentDate) newErrors.incidentDate = 'Date is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!preferredContact) newErrors.preferredContact = 'Preferred contact method is required';
    
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
      { question: 'Role', answer: role },
      { question: 'Phone', answer: phone },
      { question: 'Grievance Type', answer: grievanceType },
      { question: 'Date of Incident', answer: incidentDate },
      { question: 'Location', answer: location },
      { question: 'Description of Grievance', answer: description },
      { question: 'Previously Reported', answer: previouslyReported },
      { question: 'Desired Outcome', answer: desiredOutcome },
      { question: 'Preferred Contact', answer: preferredContact },
      { question: 'Keep Confidential', answer: keepConfidential ? 'Yes' : 'No' }
    ];
    
    // Add submission
    if (form) {
      addSubmission({
        id: `sub_${Date.now()}`,
        formId: form.id,
        formTitle: form.title,
        submitterName: name,
        submitterEmail: email,
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
          Your grievance has been submitted successfully. You will be contacted via your preferred method soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Your Role <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
          </div>
          
          <div>
            <Label htmlFor="phone">Contact Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6 space-y-4">
        <h3 className="font-medium text-lg">Grievance Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grievanceType">Grievance Type <span className="text-red-500">*</span></Label>
            <Select value={grievanceType} onValueChange={setGrievanceType}>
              <SelectTrigger className={errors.grievanceType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select type of grievance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Administrative">Administrative</SelectItem>
                <SelectItem value="Facilities">Facilities</SelectItem>
                <SelectItem value="Staff Conduct">Staff Conduct</SelectItem>
                <SelectItem value="Student Conduct">Student Conduct</SelectItem>
                <SelectItem value="Safety">Safety Concerns</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.grievanceType && <p className="text-sm text-red-500 mt-1">{errors.grievanceType}</p>}
          </div>
          
          <div>
            <Label htmlFor="incidentDate">Date of Incident <span className="text-red-500">*</span></Label>
            <Input
              id="incidentDate"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className={errors.incidentDate ? 'border-red-500' : ''}
            />
            {errors.incidentDate && <p className="text-sm text-red-500 mt-1">{errors.incidentDate}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did this occur?"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description of Grievance <span className="text-red-500">*</span></Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide a detailed description of your concern"
            className={errors.description ? 'border-red-500' : ''}
            rows={5}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>
        
        <div>
          <Label htmlFor="previouslyReported">Have you reported this issue before?</Label>
          <RadioGroup 
            value={previouslyReported} 
            onValueChange={setPreviouslyReported}
            className="flex space-x-4 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="previously-yes" />
              <Label htmlFor="previously-yes" className="font-normal">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="previously-no" />
              <Label htmlFor="previously-no" className="font-normal">No</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="desiredOutcome">Desired Outcome</Label>
          <Textarea
            id="desiredOutcome"
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            placeholder="What resolution are you seeking?"
            rows={3}
          />
        </div>
      </div>
      
      <div className="border-t pt-6 space-y-4">
        <h3 className="font-medium text-lg">Privacy & Contact Preferences</h3>
        
        <div>
          <Label htmlFor="preferredContact">Preferred Contact Method <span className="text-red-500">*</span></Label>
          <RadioGroup 
            value={preferredContact} 
            onValueChange={setPreferredContact}
            className="flex flex-col space-y-2 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Email" id="contact-email" />
              <Label htmlFor="contact-email" className="font-normal">Email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Phone" id="contact-phone" />
              <Label htmlFor="contact-phone" className="font-normal">Phone</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Both" id="contact-both" />
              <Label htmlFor="contact-both" className="font-normal">Both Email and Phone</Label>
            </div>
          </RadioGroup>
          {errors.preferredContact && <p className="text-sm text-red-500 mt-1">{errors.preferredContact}</p>}
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="confidential" 
            checked={keepConfidential}
            onCheckedChange={(checked) => setKeepConfidential(!!checked)}
          />
          <Label htmlFor="confidential" className="font-normal cursor-pointer">
            Request confidentiality (your identity will only be known to the processing staff)
          </Label>
        </div>
      </div>
      
      <div className="pt-4">
        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
        </Button>
      </div>
    </form>
  );
};

export default GrievanceSubmissionForm;
