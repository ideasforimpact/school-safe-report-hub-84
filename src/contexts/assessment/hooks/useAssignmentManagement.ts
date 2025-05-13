
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentAssignment } from '@/types/assessment';

export const useAssignmentManagement = (userId?: string) => {
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const storedAssignments = localStorage.getItem('assessmentAssignments');
    if (storedAssignments) setAssignments(JSON.parse(storedAssignments));
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assessmentAssignments', JSON.stringify(assignments));
  }, [assignments]);
  
  const createAssignment = useCallback((assignmentData: Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy' | 'status'>) => {
    const id = uuidv4();
    const newAssignment: AssessmentAssignment = {
      id,
      ...assignmentData,
      assignedDate: new Date().toISOString(),
      assignedBy: userId || 'unknown',
      status: 'Pending'
    };
    
    setAssignments(prev => [...prev, newAssignment]);
    return id;
  }, [userId]);
  
  const updateAssignment = useCallback((id: string, updates: Partial<Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy'>>) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === id ? { ...assignment, ...updates } : assignment
      )
    );
  }, []);
  
  const deleteAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
  }, []);
  
  const getUserAssignments = useCallback((userId: string) => {
    return assignments.filter(assignment => assignment.userId === userId);
  }, [assignments]);
  
  return {
    assignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getUserAssignments,
    setAssignments
  };
};
