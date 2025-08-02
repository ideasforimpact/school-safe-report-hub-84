
// This file contains utility functions for the Insights page

import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

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

export const prepareIncidentsExcelExport = (incidents: any[]) => {
  return incidents.map(incident => {
    const peopleInvolved = incident.peopleInvolved
      .map((p: any) => `${p.name} (${p.role})${p.notes ? ` - ${p.notes}` : ''}`)
      .join('; ');
    
    const actions = incident.actions
      ? incident.actions
          .map((a: any) => `${a.description} by ${a.responsiblePerson} on ${new Date(a.date).toLocaleDateString()}`)
          .join('; ')
      : '';

    return {
      'ID': incident.id,
      'Type': incident.type,
      'Category': incident.category,
      'Subcategory': incident.subcategory,
      'Description': incident.description,
      'Date': new Date(incident.date).toLocaleDateString(),
      'Location': incident.location,
      'Status': incident.status,
      'People Involved': peopleInvolved,
      'Reported By': incident.reportedBy?.name || 'Unknown',
      'Owner': incident.owner?.name || 'Unassigned',
      'Actions Taken': actions
    };
  });
};

export const downloadExcel = (data: any[], filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Incidents Report");
  XLSX.writeFile(workbook, filename);
};

// Filters to be removed in future refactoring
export const FILTERS_TO_REMOVE = ['person', 'role'];
