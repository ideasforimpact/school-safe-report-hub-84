
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

  // Get the appropriate color class for incident status badges with consistent backgrounds
  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'New':
        return 'bg-blue-500 text-white border-blue-500';
      case 'Open':
        return 'bg-red-500 text-white border-red-500';
      case 'In Progress':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'Closed':
        return 'bg-green-500 text-white border-green-500';
      case 'On Hold':
        return 'bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-gray-500 text-white border-gray-500';
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
