
import { useState, useEffect } from 'react';
import { AssessmentAssignment } from '@/types/assessmentTypes';
import { v4 as uuidv4 } from 'uuid';

// Mock storage key for local development
const ASSIGNMENTS_KEY = 'assessment_assignments';

export const useAssignmentManagement = () => {
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    setIsLoading(true);
    
    // Load assignments from localStorage
    try {
      const storedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);
      if (storedAssignments) {
        const parsedAssignments = JSON.parse(storedAssignments);
        
        // Convert date strings back to Date objects
        const assignmentsWithDates = parsedAssignments.map((assignment: any) => ({
          ...assignment,
          dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined
        }));
        
        setAssignments(assignmentsWithDates);
        console.log('Loaded assignments with dates:', assignmentsWithDates);
      }
    } catch (error) {
      console.error('Error loading assessment assignments:', error);
    }
    
    setIsLoading(false);
  }, []);

  // Save assignments whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
        console.log('Saved assignments to localStorage:', assignments);
      } catch (error) {
        console.error('Error saving assignments to localStorage:', error);
      }
    }
  }, [assignments, isLoading]);

  // Assign template to users
  const assignTemplate = (templateId: string, userIds: string[], dueDate?: Date) => {
    const newAssignments = userIds.map(userId => ({
      id: uuidv4(),
      templateId,
      userId,
      dueDate,
      status: 'assigned' as const
    }));
    
    setAssignments(prev => [...prev, ...newAssignments]);
    console.log('Created new assignments:', newAssignments);
    return newAssignments;
  };

  // Get assignments for a template
  const getAssignmentsByTemplate = (templateId: string) => {
    return assignments.filter(assignment => assignment.templateId === templateId);
  };

  // Get assignments for a user
  const getAssignmentsByUser = (userId: string) => {
    return assignments.filter(assignment => assignment.userId === userId);
  };

  // Delete assignments for a template
  const deleteAssignmentsByTemplate = (templateId: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.templateId !== templateId));
  };

  return {
    assignments,
    assignTemplate,
    getAssignmentsByTemplate,
    getAssignmentsByUser,
    deleteAssignmentsByTemplate
  };
};
