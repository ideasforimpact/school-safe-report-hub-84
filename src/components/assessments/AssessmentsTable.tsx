
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, FileText, Calendar, Users, AlertCircle, Star } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

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
  creator_name?: string;
  assignee_name?: string;
  client_id: string;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

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
      
      // Fetch assessments with employee names for the specific client
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
          client_id,
          creator:employees!assessments_created_by_fkey(first_name, last_name),
          assignee:employees!assessments_assigned_to_fkey(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAssessments = assessmentsData?.map(assessment => ({
        ...assessment,
        creator_name: assessment.creator 
          ? `${assessment.creator.first_name} ${assessment.creator.last_name}`
          : 'Unknown',
        assignee_name: assessment.assignee 
          ? `${assessment.assignee.first_name} ${assessment.assignee.last_name}`
          : 'Unassigned'
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

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800',
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
      console.log('Attempting to delete assessment:', assessmentToDelete);
      
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentToDelete.id)
        .eq('client_id', clientId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Assessment deleted successfully from database');
      
      // Immediately remove from local state for instant UI update
      const updatedAssessments = assessments.filter(a => a.id !== assessmentToDelete.id);
      setAssessments(updatedAssessments);
      setFilteredAssessments(updatedAssessments.filter(assessment => {
        // Apply existing filters
        let filtered = true;
        
        if (searchTerm) {
          filtered = filtered && (
            assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.assessment_id.toString().includes(searchTerm)
          );
        }

        if (statusFilter !== 'all') {
          filtered = filtered && assessment.status.toLowerCase() === statusFilter.toLowerCase();
        }

        return filtered;
      }));

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
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
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
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessments Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
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
                      Score
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
                        <span className="font-medium">{formatScore(assessment.score)}</span>
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
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Answer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assessment.assessment_id)}
                        >
                          <Edit className="h-4 w-4" />
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
    </>
  );
};

export default AssessmentsTable;
