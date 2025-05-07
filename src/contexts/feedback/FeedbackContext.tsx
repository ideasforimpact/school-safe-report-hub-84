
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FeedbackContextType, FeedbackForm, FormSubmission, SubmissionStatus } from './types';
import { initialForms, initialSubmissions } from './initialData';

// Create the context
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Provider component
export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<FeedbackForm[]>(() => {
    try {
      const storedForms = localStorage.getItem('feedbackForms');
      return storedForms ? JSON.parse(storedForms) : initialForms;
    } catch (error) {
      console.error('Error loading forms from local storage:', error);
      return initialForms;
    }
  });

  const [submissions, setSubmissions] = useState<FormSubmission[]>(() => {
    try {
      const storedSubmissions = localStorage.getItem('feedbackSubmissions');
      return storedSubmissions ? JSON.parse(storedSubmissions) : initialSubmissions;
    } catch (error) {
      console.error('Error loading submissions from local storage:', error);
      return initialSubmissions;
    }
  });

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    localStorage.setItem('feedbackForms', JSON.stringify(forms));
  }, [forms]);

  React.useEffect(() => {
    localStorage.setItem('feedbackSubmissions', JSON.stringify(submissions));
  }, [submissions]);

  const addForm = (form: FeedbackForm) => {
    setForms(prevForms => [...prevForms, form]);
  };

  const updateForm = (updatedForm: FeedbackForm) => {
    setForms(prevForms => 
      prevForms.map(form => 
        form.id === updatedForm.id ? updatedForm : form
      )
    );
  };

  const deleteForm = (formId: string) => {
    setForms(prevForms => prevForms.filter(form => form.id !== formId));
    // Also remove associated submissions
    setSubmissions(prevSubmissions => 
      prevSubmissions.filter(submission => submission.formId !== formId)
    );
  };

  const addSubmission = (submission: FormSubmission) => {
    setSubmissions(prevSubmissions => [...prevSubmissions, submission]);
    
    // Update form submission count
    setForms(prevForms => 
      prevForms.map(form => {
        if (form.id === submission.formId) {
          return { ...form, submissions: form.submissions + 1 };
        }
        return form;
      })
    );
  };

  const updateSubmissionStatus = (submissionId: string, status: SubmissionStatus) => {
    setSubmissions(prevSubmissions => 
      prevSubmissions.map(submission => {
        if (submission.id === submissionId) {
          return { 
            ...submission, 
            status, 
            updatedAt: new Date().toISOString() 
          };
        }
        return submission;
      })
    );
  };

  // Context value
  const value = {
    forms,
    submissions,
    addForm,
    updateForm,
    deleteForm,
    addSubmission,
    updateSubmissionStatus
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

// Custom hook for using the context
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
