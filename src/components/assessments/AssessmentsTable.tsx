import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, FileText, Calendar, Users, AlertCircle, Star, Filter, UserCheck } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import AssessmentViewDialog from './view/AssessmentViewDialog';
import ReassignAssessmentDialog from './ReassignAssessmentDialog';

interface AssessmentTemplate {
  questions: any;
}

interface Assessment {
  id: string;
  assessment_id: number;
  name: string;
  status: string;
  target_completion_date: string;
  created_by: string;
  assigned_to: string;
  template_id: string;
  created_at: string;
  score: number | null;
  answers: any[];
  client_id: string;
  creator_name: string;
  assignee_name: string;
  template?: {
    questions: any[];
  };
}

interface AssessmentsTableProps {
}

const AssessmentsTable: React.FC<AssessmentsTableProps> = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAssessmentAdmin, currentUserEmployeeId, clientId } = useAssessmentAccess();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urlFilter, setUrlFilter] = useState<string | null>(null); // e.g., 'active'
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [targetDateFrom, setTargetDateFrom] = useState<Date | undefined>(undefined);
  const [targetDateTo, setTargetDateTo] = useState<Date | undefined>(undefined);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedAssessmentForReassign, setSelectedAssessmentForReassign] = useState<{
    id: number;
    assignedTo: string | null;
    assigneeName: string;
  } | null>(null);

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
      
      console.log('🔄 ASSESSMENT FETCH DEBUG - Starting fetch with role-based filtering');
      console.log('🎯 Access Control Status:', {
        hasAssessmentAdmin,
        currentUserEmployeeId,
        clientId,
        willApplyUserFilter: !hasAssessmentAdmin
      });
      
      if (!clientId) {
        console.log('❌ No client ID available - cannot fetch assessments');
        setAssessments([]);
        setFilteredAssessments([]);
        setLoading(false);
        return;
      }

      if (!currentUserEmployeeId) {
        console.log('❌ No employee ID available - cannot fetch assessments');
        setAssessments([]);
        setFilteredAssessments([]);
        setLoading(false);
        return;
      }
      
      // Build query with role-based filtering
      let query = supabase
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
        .eq('client_id', clientId);

      console.log('🔍 Base query created for client_id:', clientId);

      // Apply role-based filtering
      if (!hasAssessmentAdmin) {
        console.log('🚫 User is NOT admin - applying role-based filter');
        console.log('🎯 Filtering for assessments where:');
        console.log(`   - created_by = ${currentUserEmployeeId} OR`);
        console.log(`   - assigned_to = ${currentUserEmployeeId}`);
        
        query = query.or(`created_by.eq.${currentUserEmployeeId},assigned_to.eq.${currentUserEmployeeId}`);
      } else {
        console.log('👑 User IS admin - showing all assessments for client');
      }

      query = query.order('created_at', { ascending: false });

      console.log('📡 Executing database query...');
      const { data: assessmentsData, error } = await query;

      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }

      console.log('✅ Database query successful');
      console.log('📊 Raw data received:', {
        totalRecords: assessmentsData?.length || 0,
        sampleRecord: assessmentsData?.[0] || 'No records'
      });

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

      console.log('🎯 Formatted assessments for current user:', {
        totalCount: formattedAssessments.length,
        createdByUser: formattedAssessments.filter(a => a.created_by === currentUserEmployeeId).length,
        assignedToUser: formattedAssessments.filter(a => a.assigned_to === currentUserEmployeeId).length,
        shouldSeeAll: hasAssessmentAdmin
      });

      // Additional verification for non-admin users
      if (!hasAssessmentAdmin) {
        const invalidRecords = formattedAssessments.filter(a => 
          a.created_by !== currentUserEmployeeId && a.assigned_to !== currentUserEmployeeId
        );
        if (invalidRecords.length > 0) {
          console.error('🚨 SECURITY ISSUE: Non-admin user received assessments they should not see:', invalidRecords);
        } else {
          console.log('✅ Security check passed: All records are properly filtered for non-admin user');
        }
      }

      setAssessments(formattedAssessments);
      setFilteredAssessments(formattedAssessments);
    } catch (error) {
      console.error('❌ Error fetching assessments:', error);
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
    if (clientId && currentUserEmployeeId) {
      fetchAssessments();
    } else {
      setLoading(false);
    }
  }, [clientId, currentUserEmployeeId, hasAssessmentAdmin]);

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

    // Filter by status (dropdown)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => 
        assessment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // URL-driven filter: active => exclude Completed
    if (urlFilter === 'active') {
      filtered = filtered.filter(assessment => assessment.status !== 'Completed');
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
  }, [assessments, searchTerm, statusFilter, createdByFilter, assignedToFilter, targetDateFrom, targetDateTo, urlFilter]);

  // Parse URL parameters and set initial filters
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    setUrlFilter(filterParam);

    if (filterParam && filterParam !== 'active') {
      // Map other query filters to status dropdown
      let initialStatus = '';
      switch (filterParam) {
        case 'completed':
          initialStatus = 'completed';
          break;
        case 'new':
          initialStatus = 'new';
          break;
        case 'draft':
          initialStatus = 'draft';
          break;
        case 'submitted':
          initialStatus = 'submitted';
          break;
        default:
          initialStatus = '';
      }
      if (initialStatus) {
        setStatusFilter(initialStatus);
      } else {
        setStatusFilter('all');
      }
    } else if (filterParam === 'active') {
      // Ensure dropdown remains at All while URL filter is applied
      setStatusFilter('all');
    } else {
      // No URL filter: restore dropdown and data to defaults
      setStatusFilter('all');
    }
  }, [searchParams]);

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

  const handleView = (assessmentId: number) => {
    setSelectedAssessmentId(assessmentId);
    setViewDialogOpen(true);
  };

  const isAnswerButtonEnabled = (status: string) => {
    return status === 'New' || status === 'Draft';
  };

  const isAssignedToCurrentUser = (assignedTo: string | null) => {
    return assignedTo === currentUserEmployeeId;
  };

  const handleAssessmentUpdated = () => {
    // Refetch assessments when an assessment is updated
    fetchAssessments();
  };

  const handleReassign = (assessment: Assessment) => {
    setSelectedAssessmentForReassign({
      id: assessment.assessment_id,
      assignedTo: assessment.assigned_to,
      assigneeName: assessment.assignee_name || 'Unassigned'
    });
    setReassignDialogOpen(true);
  };

  const handleReassignSuccess = () => {
    // Refetch assessments after successful reassignment
    fetchAssessments();
  };

  // Check if user can reassign this assessment (admin + created by user)
  const canReassignAssessment = (assessment: Assessment) => {
    return hasAssessmentAdmin && assessment.created_by === currentUserEmployeeId;
  };

  if (!clientId) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Client Context Required</h3>
              <p className="text-gray-500">Please ensure you are logged in with a valid client context to view assessments.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading assessments...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Assessments</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchAssessments} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Assessments</h2>
            {!hasAssessmentAdmin && (
              <Badge variant="outline" className="ml-2">
                Your Assessments Only
              </Badge>
            )}
          </div>
          
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
        </div>

        <div className="p-0">
          {filteredAssessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No assessments found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.assessment_id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate" title={assessment.name}>
                          {assessment.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assessment.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{calculateCompletionPercentage(assessment)}%</span>
                      </TableCell>
                      <TableCell>
                        {formatDate(assessment.target_completion_date)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={assessment.creator_name}>
                          {assessment.creator_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={assessment.assignee_name}>
                          {assessment.assignee_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Only show Answer button if user is assigned to this assessment */}
                          {isAssignedToCurrentUser(assessment.assigned_to) && (
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
                          )}
                          
                          {/* Show Reassign button only for admins and their own assessments */}
                          {canReassignAssessment(assessment) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReassign(assessment)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(assessment.assessment_id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Assessment View Dialog */}
      <AssessmentViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        assessmentId={selectedAssessmentId || 0}
        onAssessmentUpdated={handleAssessmentUpdated}
      />

      {/* Reassign Assessment Dialog */}
      {selectedAssessmentForReassign && (
        <ReassignAssessmentDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          assessmentId={selectedAssessmentForReassign.id}
          currentAssigneeId={selectedAssessmentForReassign.assignedTo}
          currentAssigneeName={selectedAssessmentForReassign.assigneeName}
          onReassignSuccess={handleReassignSuccess}
        />
      )}
    </>
  );
};

export default AssessmentsTable;
