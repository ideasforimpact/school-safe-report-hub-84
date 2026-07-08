import React, { useEffect, useState } from 'react';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Filter, MessageSquare } from 'lucide-react';
import GrievanceDetailDialog from './GrievanceDetailDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TablePaginationBar from '@/components/common/TablePaginationBar';

const PAGE_SIZE = 10;

const GrievancesList = () => {
  const {
    submissions
  } = useGrievance();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const getResponseValue = (submissionId: string, questionText: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return '';
    const response = submission.responses.find(r => r.question === questionText);
    return response ? response.answer : '';
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (statusFilter !== 'all' && submission.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const heading = getResponseValue(submission.id, 'Grievance Heading');
      const description = getResponseValue(submission.id, 'Description of Grievance');
      const matches =
        submission.submitterName?.toLowerCase().includes(term) ||
        heading?.toLowerCase().includes(term) ||
        description?.toLowerCase().includes(term);
      if (!matches) return false;
    }

    return true;
  });

  const totalCount = filteredSubmissions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubmissions = filteredSubmissions.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // Reset to page 1 whenever the filters narrow/widen the result set.
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
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

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmission(submissionId);
  };

  // Helper function to capitalize the first letter of status
  const capitalizeStatus = (status: string): string => {
    // Replace underscores with spaces and capitalize each word
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  return <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <DebouncedSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name or grievance..."
          triggerOnEnter
          className="w-full max-w-sm"
        />
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
      </div>

      {filteredSubmissions.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Grievances Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            There are no grievances matching your current filters. Try changing filters or check back later.
          </p>
        </div> : <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">No</TableHead>
                <TableHead className="text-left">Name</TableHead>
                <TableHead className="text-left">Grievance</TableHead>
                <TableHead className="text-left">Followup Required</TableHead>
                <TableHead className="text-left">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubmissions.map((submission, index) => <TableRow key={submission.id}>
                  <TableCell className="font-medium text-left">
                    {(safeCurrentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="text-left">
                    {submission.submitterName}
                  </TableCell>
                  <TableCell className="max-w-xs text-left">
                    {truncateText(getResponseValue(submission.id, 'Grievance Heading') || getResponseValue(submission.id, 'Description of Grievance'), 15)}
                  </TableCell>
                  <TableCell className="text-left">
                    {submission.needsFollowup ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge variant={getStatusBadgeVariant(submission.status)}>
                      {capitalizeStatus(submission.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission.id)} className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Button>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
          <TablePaginationBar
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            itemLabel="grievances"
            onPageChange={setCurrentPage}
          />
        </div>}

      {selectedSubmission && <GrievanceDetailDialog submissionId={selectedSubmission} onClose={() => setSelectedSubmission(null)} />}
    </div>;
};

export default GrievancesList;
