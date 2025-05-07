
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeedback } from '@/contexts/feedback/FeedbackContext';
import { FormResponse } from '@/contexts/feedback/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const FormResponsePage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { forms, addSubmission } = useFeedback();
  
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Find the form
  const form = forms.find(f => f.id === formId);

  useEffect(() => {
    // Initialize responses
    if (form) {
      const initialResponses: Record<string, string | string[]> = {};
      form.questions.forEach(question => {
        if (question.type === 'checkbox') {
          initialResponses[question.id] = [];
        } else {
          initialResponses[question.id] = '';
        }
      });
      setResponses(initialResponses);
    }
  }, [form]);

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600">Form Not Found</h1>
          <p className="mt-2 text-gray-600">
            The form you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-amber-600">Form Not Available</h1>
          <p className="mt-2 text-gray-600">
            This form is currently not accepting responses.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-green-600">Thank You</h1>
          <p className="mt-2 text-gray-600">
            Your response has been submitted successfully.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (questionId: string, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error if field is now valid
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setResponses(prev => {
      const currentOptions = Array.isArray(prev[questionId]) ? [...prev[questionId] as string[]] : [];
      
      if (checked) {
        return { ...prev, [questionId]: [...currentOptions, option] };
      } else {
        return { 
          ...prev, 
          [questionId]: currentOptions.filter(item => item !== option) 
        };
      }
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Valid email is required';
    }
    
    // Validate form questions
    form.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (!response || (Array.isArray(response) && response.length === 0)) {
          newErrors[question.id] = 'This question is required';
        }
      }
    });
    
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
    const formattedResponses: FormResponse[] = form.questions.map(question => {
      const response = responses[question.id];
      let answerText: string;
      
      if (Array.isArray(response)) {
        answerText = response.join(', ');
      } else {
        answerText = response as string;
      }
      
      return {
        question: question.text,
        answer: answerText
      };
    });
    
    // Add submission
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
      description: "Your response has been submitted successfully"
    });
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* Submitter Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Your Email <span className="text-red-500">*</span></Label>
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
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-4">Form Questions</h3>
              
              {form.questions.map((question, index) => (
                <div key={question.id} className="mb-6">
                  <Label className="flex">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  <div className="mt-2">
                    {question.type === 'text' && (
                      <Textarea
                        value={responses[question.id] as string || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className={errors[question.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {question.type === 'radio' && (
                      <RadioGroup
                        value={responses[question.id] as string || ''}
                        onValueChange={(value) => handleInputChange(question.id, value)}
                        className="space-y-1"
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-option-${optIndex}`} />
                            <Label htmlFor={`${question.id}-option-${optIndex}`} className="font-normal cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    
                    {question.type === 'checkbox' && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${question.id}-option-${optIndex}`}
                              checked={(responses[question.id] as string[] || []).includes(option)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(question.id, option, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${question.id}-option-${optIndex}`} className="font-normal cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {errors[question.id] && (
                      <p className="text-sm text-red-500 mt-1">{errors[question.id]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default FormResponsePage;
