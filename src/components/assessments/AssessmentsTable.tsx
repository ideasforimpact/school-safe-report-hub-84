
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, FileText, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

interface Assessment {
  id: string;
  name: string;
  status: string;
  target_completion_date: string | null;
  created_by: string | null;
  assigned_to: string | null;
  template_id: string | null;
  created_at: string;
  creator_name?: string;
  assignee_name?: string;
}

const AssessmentsTable: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAssessments = async () => {
    if (!user?.clientId) return;
    
    try {
      setLoading(true);
      
      // Fetch assessments with employee names
      const { data: assessmentsData, error } = await supabase
        .from('assessments')
        .select(`
          id,
          name,
          status,
          target_completion_date,
          created_by,
          assigned_to,
          template_id,
          created_at,
          creator:employees!assessments_created_by_fkey(first_name, last_name),
          assignee:employees!assessments_assigned_to_fkey(first_name, last_name)
        `)
        .eq('client_id', user.clientId)
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

      setAssessments(formattedAssessments);
      setFilteredAssessments(formattedAssessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [user?.clientId]);

  useEffect(() => {
    let filtered = assessments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAnswerQuestions = (assessmentId: string) => {
    navigate(`/assessments/response/${assessmentId}`);
  };

  const handleEdit = (assessmentId: string) => {
    // Navigate to edit assessment page or open edit dialog
    toast.info('Edit functionality will be implemented');
  };

  const handleDelete = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
  };

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

  return (
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
                <TableRow key={assessment.id}>
                  <TableCell className="font-mono text-sm">
                    {assessment.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {assessment.name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assessment.status)}
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
                        onClick={() => handleAnswerQuestions(assessment.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Answer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assessment.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assessment.id)}
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
  );
};

export default AssessmentsTable;
