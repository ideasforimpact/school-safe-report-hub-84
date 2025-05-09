
import React, { createContext, useContext, useState } from 'react';
import { FeedbackForm, FormResponse } from '@/types/feedbackTypes';
import { mockFeedbackForms, mockFormResponses } from '@/data/mockFeedbackData';
import { FeedbackContextType } from '@/contexts/feedback/types';

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forms, setForms] = useState<FeedbackForm[]>(mockFeedbackForms);
  const [submissions, setSubmissions] = useState<FormResponse[]>(mockFormResponses);

  const getFormById = (id: string) => {
    return forms.find(form => form.id === id);
  };
  
  const getResponseById = (id: string) => {
    return submissions.find(response => response.id === id);
  };

  const submitFormResponse = (response: Omit<FormResponse, 'id' | 'submittedAt'>) => {
    const newResponse: FormResponse = {
      ...response,
      id: `response_${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    
    setSubmissions(prev => [...prev, newResponse]);
  };

  // Additional methods to fulfill the FeedbackContextType interface
  const addForm = (form: FeedbackForm) => {
    setForms(prev => [...prev, form]);
  };

  const updateForm = (form: FeedbackForm) => {
    setForms(prev => prev.map(f => f.id === form.id ? form : f));
  };

  const deleteForm = (formId: string) => {
    setForms(prev => prev.filter(f => f.id !== formId));
  };

  const addSubmission = (submission: FormResponse) => {
    setSubmissions(prev => [...prev, submission]);
  };

  const updateSubmissionStatus = (submissionId: string, status: SubmissionStatus) => {
    setSubmissions(prev => 
      prev.map(sub => sub.id === submissionId ? { ...sub, status } : sub)
    );
  };

  return (
    <FeedbackContext.Provider 
      value={{ 
        forms, 
        submissions, 
        getFormById,
        getResponseById,
        addForm,
        updateForm,
        deleteForm,
        addSubmission,
        updateSubmissionStatus,
        submitFormResponse
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
