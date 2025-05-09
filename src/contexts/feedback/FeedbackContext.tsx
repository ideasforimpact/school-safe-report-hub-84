
import React, { createContext, useContext, useState } from 'react';
import { FeedbackForm, FormResponse } from '@/types/feedbackTypes';
import { mockFeedbackForms, mockFormResponses } from '@/data/mockFeedbackData';

interface FeedbackContextType {
  forms: FeedbackForm[];
  responses: FormResponse[];
  getFormById: (id: string) => FeedbackForm | undefined;
  getResponseById: (id: string) => FormResponse | undefined;
  submitFormResponse: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => void;
}

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
  const [responses, setResponses] = useState<FormResponse[]>(mockFormResponses);

  const getFormById = (id: string) => {
    return forms.find(form => form.id === id);
  };
  
  const getResponseById = (id: string) => {
    return responses.find(response => response.id === id);
  };

  const submitFormResponse = (response: Omit<FormResponse, 'id' | 'submittedAt'>) => {
    const newResponse: FormResponse = {
      ...response,
      id: `response_${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    
    setResponses(prev => [...prev, newResponse]);
  };

  return (
    <FeedbackContext.Provider 
      value={{ 
        forms, 
        responses, 
        getFormById,
        getResponseById,
        submitFormResponse 
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
