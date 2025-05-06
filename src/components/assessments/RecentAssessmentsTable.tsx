
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface Assessment {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  score: number | null;
}

interface RecentAssessmentsTableProps {
  assessments: Assessment[];
}

const RecentAssessmentsTable: React.FC<RecentAssessmentsTableProps> = ({ assessments }) => {
  // Helper function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'Completed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'In Review':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'Pending':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-800';
        break;
      case 'In Progress':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell className="font-medium">{assessment.id}</TableCell>
              <TableCell>{assessment.title}</TableCell>
              <TableCell>{assessment.type}</TableCell>
              <TableCell>{renderStatusBadge(assessment.status)}</TableCell>
              <TableCell>{formatDate(assessment.date)}</TableCell>
              <TableCell>
                {assessment.score !== null ? `${assessment.score}%` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentAssessmentsTable;
