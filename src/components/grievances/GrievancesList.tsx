
import React, { useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Filter, MessageSquare } from 'lucide-react';
import GrievanceDetailDialog from './GrievanceDetailDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GrievancesList = () => {
  const { submissions } = useGrievance();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
      submission.responses.some(r => 
        r.question === 'Grievance Type' && r.answer.includes(typeFilter)
      );
    return matchesStatus && matchesType;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getResponseValue = (submissionId: string, questionText: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return '';
    
    const response = submission.responses.find(r => r.question === questionText);
    return response ? response.answer : '';
  };

  const uniqueTypes = Array.from(new Set(
    submissions.flatMap(s => 
      s.responses
        .filter(r => r.question === 'Grievance Type')
        .map(r => r.answer)
    )
  ));

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmission(submissionId);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium mr-2">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium mr-2">Type:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Grievances Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            There are no grievances matching your current filters. Try changing filters or check back later.
          </p>
        </div>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Brief Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map(submission => (
                <TableRow key={submission.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {submission.submitterName}
                  </TableCell>
                  <TableCell>
                    {getResponseValue(submission.id, 'Grievance Type')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getResponseValue(submission.id, 'Description of Grievance').substring(0, 50)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(submission.status) as any}>
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewSubmission(submission.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedSubmission && (
        <GrievanceDetailDialog 
          submissionId={selectedSubmission} 
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default GrievancesList;
