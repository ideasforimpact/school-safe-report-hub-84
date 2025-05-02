
import { useState } from 'react';
import { IncidentStatus, Comment as IncidentComment } from '@/types/incident';

/**
 * Custom hook that provides formatting and utility functions for incident details
 */
export const useIncidentDetail = () => {
  // Format a date to a simple date string (Month Day, Year)
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format a date to include time (Month Day, Year, HH:MM)
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get the appropriate color class for incident status badges
  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the appropriate color class for comment status badges
  const getCommentStatusColor = (status: IncidentComment['status']) => {
    switch(status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status update state management for incident status changes
  const useStatusUpdate = (initialStatus: IncidentStatus) => {
    const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>(initialStatus);
    return { statusUpdate, setStatusUpdate };
  };

  return {
    formatDate,
    formatDateTime,
    getStatusColor,
    getCommentStatusColor,
    useStatusUpdate
  };
};
