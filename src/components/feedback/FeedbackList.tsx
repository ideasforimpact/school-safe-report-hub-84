
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock, Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedback } from '@/contexts/feedback/FeedbackContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FeedbackList = () => {
  const { submissions } = useFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForm, setFilterForm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);

  // Get the submission being viewed
  const submissionDetails = viewingSubmission 
    ? submissions.find(sub => sub.id === viewingSubmission)
    : null;

  // Filter submissions based on search and filters
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
      submission.submitterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormFilter = filterForm === 'all' || submission.formId === filterForm;
    const matchesStatusFilter = filterStatus === 'all' || submission.status === filterStatus;
    
    return matchesSearch && matchesFormFilter && matchesStatusFilter;
  });

  // Get unique form IDs for filter dropdown
  const formOptions = [...new Set(submissions.map(s => ({ id: s.formId, title: s.formTitle })))];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search submissions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterForm} onValueChange={setFilterForm}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {formOptions.map(form => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Statuses" />
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

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No submissions found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No feedback or grievance submissions match your current filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead className="hidden md:table-cell">Submitted On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map(submission => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.formTitle}</TableCell>
                  <TableCell>{submission.submitterName}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingSubmission(submission.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Submission Details Dialog */}
      {submissionDetails && (
        <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{submissionDetails.formTitle}</span>
                {getStatusBadge(submissionDetails.status)}
              </DialogTitle>
              <DialogDescription>
                Submitted by {submissionDetails.submitterName} on {new Date(submissionDetails.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-4 mt-2 mb-4">
                {submissionDetails.responses.map((response, index) => (
                  <div key={index} className="border-b pb-3">
                    <h4 className="font-medium text-gray-700">{response.question}</h4>
                    <p className="mt-1">{response.answer}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Update Status</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={submissionDetails.status === 'in_progress' ? 'default' : 'outline'}
                    className="gap-1"
                    onClick={() => {/* Update status */}}
                  >
                    <Clock className="h-4 w-4" />
                    In Progress
                  </Button>
                  <Button 
                    size="sm" 
                    variant={submissionDetails.status === 'resolved' ? 'default' : 'outline'}
                    className="gap-1"
                    onClick={() => {/* Update status */}}
                  >
                    <Check className="h-4 w-4" />
                    Resolved
                  </Button>
                  <Button 
                    size="sm" 
                    variant={submissionDetails.status === 'closed' ? 'default' : 'outline'}
                    className="gap-1"
                    onClick={() => {/* Update status */}}
                  >
                    <X className="h-4 w-4" />
                    Closed
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FeedbackList;
