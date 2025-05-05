
// This file contains utility functions for the Insights page

import { DateRange } from 'react-day-picker';

export interface PersonData {
  name: string;
  id: string;
  role: string;
  incidents: Array<{
    id: string;
    date: string;
    type: string;
    category: string;
    subcategory: string;
    status: string;
  }>;
  count: number;
}

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const prepareCSVContent = (headers: string[], rows: string[]): string => {
  return `${headers.join(',')}\n${rows.join('\n')}`;
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const preparePeopleExport = (peopleData: PersonData[]): string => {
  // Create headers for the CSV
  const headers = [
    'Name',
    'ID',
    'Role',
    'Incident Count',
    'Incident IDs',
    'Incident Dates',
    'Categories'
  ];
  
  // Create rows for each person
  const rows = peopleData.map(person => {
    const incidentIds = person.incidents.map(i => i.id).join('; ');
    const incidentDates = person.incidents.map(i => new Date(i.date).toLocaleDateString()).join('; ');
    const categories = person.incidents.map(i => i.category).join('; ');
    
    return [
      `"${person.name}"`,
      person.id,
      person.role,
      person.count,
      `"${incidentIds}"`,
      `"${incidentDates}"`,
      `"${categories}"`
    ].join(',');
  });
  
  return prepareCSVContent(headers, rows);
};

export const prepareIncidentsExport = (incidents: any[]): string => {
  // Prepare the CSV header
  const headers = [
    'ID',
    'Type',
    'Category',
    'Subcategory',
    'Description',
    'Date',
    'Location',
    'Status',
    'People Involved',
    'Reported By',
    'Owner',
    'Actions Taken'
  ];
  
  // Prepare the CSV rows
  const rows = incidents.map(incident => {
    const peopleInvolved = incident.peopleInvolved
      .map((p: any) => `${p.name} (${p.role})${p.notes ? ` - ${p.notes}` : ''}`)
      .join('; ');
    
    const actions = incident.actions
      ? incident.actions
          .map((a: any) => `${a.description} by ${a.responsiblePerson} on ${new Date(a.date).toLocaleDateString()}`)
          .join('; ')
      : '';
    
    return [
      incident.id,
      incident.type,
      incident.category,
      incident.subcategory,
      `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes
      new Date(incident.date).toLocaleDateString(),
      incident.location,
      incident.status,
      `"${peopleInvolved}"`,
      incident.reportedBy?.name || 'Unknown',
      incident.owner?.name || 'Unassigned',
      `"${actions}"`
    ].join(',');
  });
  
  return prepareCSVContent(headers, rows);
};

// Filters to be removed in future refactoring
export const FILTERS_TO_REMOVE = ['person', 'role'];
