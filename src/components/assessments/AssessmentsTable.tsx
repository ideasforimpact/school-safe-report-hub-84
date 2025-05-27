import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Trash2, FileText, Calendar, Users, AlertCircle, Star, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import AssessmentViewDialog from './view/AssessmentViewDialog';

interface AssessmentTemplate {
  questions: any;
}

interface Assessment {
  id: string;
  assessment_id: number;
  name: string;
  status: string;
  target_completion_date: string | null;
  created_by: string | null;
  assigned_to: string | null;
  template_id: string | null;
  created_at: string;
  score: number | null;
  answers: any[] | null;
  creator_name?: string;
  assignee_name?: string;
  client_id: string;
  template?: AssessmentTemplate;
}

const AssessmentsTable: React.FC = () => {
  const navigate = useNavigate();
  const { user, employeeData } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [targetDateFrom, setTargetDateFrom] = useState<Date | undefined>(undefined);
  const [targetDateTo, setTargetDateTo] = useState<Date | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // Get unique creators and assignees for filter options
  const getUniqueCreators = () => {
    const creators = assessments
      .filter(a => a.creator_name)
      .map(a => ({ id: a.created_by, name: a.creator_name }))
      .filter((creator, index, self) => 
        creator.name && self.findIndex(c => c.id === creator.id) === index
      );
    return creators;
  };

  const getUniqueAssignees = () => {
    const assignees = assessments
      .filter(a => a.assignee_name && a.assignee_name !== 'Unassigned')
      .map(a => ({ id: a.assigned_to, name: a.assignee_name }))
      .filter((assignee, index, self) => 
        assignee.name && self.findIndex(a => a.id === assignee.id) === index
      );
    return assignees;
  };

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching assessments with user:', user);
      console.log('Employee data:', employeeData);
      console.log('Using client_id:', clientId);
      
      if (!clientId) {
        console.log('No client ID available - cannot fetch assessments');
        setAssessments([]);
        setFilteredAssessments([]);
        setLoading(false);
        return;
      }
      
      // Fetch assessments with employee names and template data for the specific client
      const { data: assessmentsData, error } = await supabase
        .from('assessments')
        .select(`
          id,
          assessment_id,
          name,
          status,
          target_completion_date,
          created_by,
          assigned_to,
          template_id,
          created_at,
          score,
          answers,
          client_id,
          creator:employees!assessments_created_by_fkey(first_name, last_name),
          assignee:employees!assessments_assigned_to_fkey(first_name, last_name),
          template:assessment_templates(questions)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAssessments = assessmentsData?.map(assessment => ({
        ...assessment,
        answers: Array.isArray(assessment.answers) ? assessment.answers : [],
        creator_name: assessment.creator 
          ? `${assessment.creator.first_name} ${assessment.creator.last_name}`
          : 'Unknown',
        assignee_name: assessment.assignee 
          ? `${assessment.assignee.first_name} ${assessment.assignee.last_name}`
          : 'Unassigned',
        template: assessment.template ? {
          questions: Array.isArray(assessment.template.questions) ? assessment.template.questions : []
        } : undefined
      })) || [];

      console.log('Fetched assessments:', formattedAssessments);
      setAssessments(formattedAssessments);
      setFilteredAssessments(formattedAssessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError('Failed to fetch assessments');
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage based on answers
  const calculateCompletionPercentage = (assessment: Assessment) => {
    if (!assessment.answers || !assessment.template?.questions) {
      return 0;
    }

    const answers = Array.isArray(assessment.answers) ? assessment.answers : [];
    const questions = Array.isArray(assessment.template.questions) ? assessment.template.questions : [];
    const totalQuestions = questions.length;
    
    if (totalQuestions === 0) return 0;
    
    const answeredQuestions = answers.filter(answer => 
      answer && typeof answer === 'object' && answer.answer !== undefined
    ).length;
    
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  useEffect(() => {
    if (clientId) {
      fetchAssessments();
    } else {
      setLoading(false);
    }
  }, [user, employeeData, clientId]);

  useEffect(() => {
    let filtered = assessments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assessment_id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => 
        assessment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by created by
    if (createdByFilter !== 'all') {
      filtered = filtered.filter(assessment => 
        assessment.created_by === createdByFilter
      );
    }

    // Filter by assigned to
    if (assignedToFilter !== 'all') {
      filtered = filtered.filter(assessment => 
        assessment.assigned_to === assignedToFilter
      );
    }

    // Filter by target date range
    if (targetDateFrom || targetDateTo) {
      filtered = filtered.filter(assessment => {
        if (!assessment.target_completion_date) return false;
        
        const targetDate = new Date(assessment.target_completion_date);
        const fromMatch = !targetDateFrom || targetDate >= targetDateFrom;
        const toMatch = !targetDateTo || targetDate <= targetDateTo;
        
        return fromMatch && toMatch;
      });
    }

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, statusFilter, createdByFilter, assignedToFilter, targetDateFrom, targetDateTo]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCreatedByFilter('all');
    setAssignedToFilter('all');
    setTargetDateFrom(undefined);
    setTargetDateTo(undefined);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800',
      'Draft': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Submitted': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '0';
    return score.toString();
  };

  const handleAnswerQuestions = (assessmentId: number) => {
    navigate(`/assessment/answer/${assessmentId}`);
  };

  const handleEdit = (assessmentId: number) => {
    // Navigate to edit assessment page or open edit dialog
    toast.info('Edit functionality will be implemented');
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete || !clientId) {
      toast.error('Assessment or client information is missing');
      return;
    }

    try {
      console.log('=== CALLING DELETE EDGE FUNCTION ===');
      console.log('Assessment to delete:', assessmentToDelete);
      console.log('Assessment UUID (id):', assessmentToDelete.id);
      console.log('Client ID:', clientId);

      // Call the delete-assessment edge function
      const { data, error } = await supabase.functions.invoke('delete-assessment', {
        body: {
          assessment_id: assessmentToDelete.id,
          client_id: clientId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to delete assessment');
      }

      if (!data.success) {
        console.error('Delete operation failed:', data);
        throw new Error(data.error || 'Failed to delete assessment');
      }

      console.log('Assessment deleted successfully via edge function:', data);
      
      // Remove from local state
      const updatedAssessments = assessments.filter(a => a.id !== assessmentToDelete.id);
      setAssessments(updatedAssessments);
      
      // Re-apply filters to the updated list
      let filteredList = updatedAssessments;
      
      if (searchTerm) {
        filteredList = filteredList.filter(assessment =>
          assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.assessment_id.toString().includes(searchTerm)
        );
      }

      if (statusFilter !== 'all') {
        filteredList = filteredList.filter(assessment => 
          assessment.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      setFilteredAssessments(filteredList);

      toast.success('Assessment deleted successfully');
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  const handleView = (assessmentId: number) => {
    setSelectedAssessmentId(assessmentId);
    setViewDialogOpen(true);
  };

  const isAnswerButtonEnabled = (status: string) => {
    return status === 'New' || status === 'Draft';
  };

  if (!clientId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Client Context Required</h3>
            <p className="text-gray-500">Please ensure you are logged in with a valid client context to view assessments.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading assessments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Assessments</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAssessments} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessments
          </CardTitle>
          
          {/* Enhanced Filters */}
          <div className="space-y-4">
            {/* First row - Search and Status */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second row - Created By, Assigned To, and Date Range */}
            <div className="flex gap-4 flex-wrap">
              <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {getUniqueCreators().map((creator) => (
                    <SelectItem key={creator.id} value={creator.id || ''}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {getUniqueAssignees().map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id || ''}>
                      {assignee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <DatePicker
                  date={targetDateFrom}
                  onChange={setTargetDateFrom}
                  placeholderText="Target date from"
                  className="w-48"
                />
                <DatePicker
                  date={targetDateTo}
                  onChange={setTargetDateTo}
                  placeholderText="Target date to"
                  className="w-48"
                />
              </div>

              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessments Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || createdByFilter !== 'all' || assignedToFilter !== 'all' || targetDateFrom || targetDateTo
                  ? 'No assessments match your current filters.' 
                  : 'No assessments have been created yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Percentage Completed
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Target Date
                    </div>
                  </TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Assigned To
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.map((assessment) => (
                  <TableRow key={assessment.assessment_id}>
                    <TableCell className="font-mono text-sm">
                      #{assessment.assessment_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {assessment.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assessment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{calculateCompletionPercentage(assessment)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(assessment.target_completion_date)}
                    </TableCell>
                    <TableCell>
                      {assessment.creator_name}
                    </TableCell>
                    <TableCell>
                      {assessment.assignee_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnswerQuestions(assessment.assessment_id)}
                          disabled={!isAnswerButtonEnabled(assessment.status)}
                          className={`${
                            isAnswerButtonEnabled(assessment.status)
                              ? 'text-blue-600 hover:text-blue-700'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Answer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(assessment.assessment_id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(assessment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{assessmentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assessment View Dialog */}
      <AssessmentViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        assessmentId={selectedAssessmentId || 0}
      />
    </>
  );
};

export default AssessmentsTable;
