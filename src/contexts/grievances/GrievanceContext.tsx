
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GrievanceContextType, FormSubmission, SubmissionStatus } from './types';
import { initialSubmissions } from './initialData';

// Create the context
const GrievanceContext = createContext<GrievanceContextType | undefined>(undefined);

// Provider component
export const GrievanceProvider = ({ children }: { children: ReactNode }) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(() => {
    try {
      const storedSubmissions = localStorage.getItem('grievanceSubmissions');
      return storedSubmissions ? JSON.parse(storedSubmissions) : initialSubmissions;
    } catch (error) {
      console.error('Error loading submissions from local storage:', error);
      return initialSubmissions;
    }
  });

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    localStorage.setItem('grievanceSubmissions', JSON.stringify(submissions));
  }, [submissions]);

  const addSubmission = (submission: FormSubmission) => {
    setSubmissions(prevSubmissions => [...prevSubmissions, submission]);
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
    submissions,
    addSubmission,
    updateSubmissionStatus
  };

  return (
    <GrievanceContext.Provider value={value}>
      {children}
    </GrievanceContext.Provider>
  );
};

// Custom hook for using the context
export const useGrievance = (): GrievanceContextType => {
  const context = useContext(GrievanceContext);
  if (context === undefined) {
    throw new Error('useGrievance must be used within a GrievanceProvider');
  }
  return context;
};
