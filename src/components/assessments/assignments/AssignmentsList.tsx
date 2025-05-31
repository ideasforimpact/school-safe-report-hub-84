
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertTriangle, Clock, FileCheck, FilePlus, Loader } from 'lucide-react';

const AssignmentsList = () => {
  const navigate = useNavigate();
  const { assignments, templates } = useAssessment();
  const { user, isSaasOwner, isAdmin } = useAuth();
  
  // Show all assignments for admins, only user's assignments for regular users
  const filteredAssignments = React.useMemo(() => {
    if (isSaasOwner || isAdmin) {
      return assignments;
    } else {
      return assignments.filter(assignment => assignment.userId === user?.id);
    }
  }, [assignments, isSaasOwner, isAdmin, user]);
  
  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.title : 'Unknown Template';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusBadge = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Check if overdue
    if (status !== 'Completed' && status !== 'Submitted' && due < now) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    
    // Status-based badges
    switch (status) {
      case 'Completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <FileCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'Submitted':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <FileCheck className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'New':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <FilePlus className="h-3 w-3 mr-1" />
            New
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days remaining`;
  };
  
  const handleRespondClick = (assignmentId: string) => {
    //console.log(`Navigating to assignment response for ID: ${assignmentId}`);
    navigate(`/assessments/respond/${assignmentId}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assessment Assignments</h2>
      </div>

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assignments</h3>
            <p className="text-gray-500 text-center mb-4">
              {isSaasOwner || isAdmin
                ? "No assessments have been assigned to users yet."
                : "You don't have any assessments assigned to you."}
            </p>
            {(isSaasOwner || isAdmin) && (
              <Button onClick={() => navigate('/assessments/templates')}>
                Go to Templates
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isSaasOwner || isAdmin ? 'All Assignments' : 'My Assignments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  {(isSaasOwner || isAdmin) && <TableHead>User</TableHead>}
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {getTemplateName(assignment.templateId)}
                    </TableCell>
                    {(isSaasOwner || isAdmin) && (
                      <TableCell>{assignment.userName}</TableCell>
                    )}
                    <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status, assignment.dueDate)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {getDaysRemaining(assignment.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRespondClick(assignment.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {assignment.status === 'Completed' || assignment.status === 'Submitted' ? 'View' : 'Respond'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentsList;
