
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssessments } from '@/hooks/useAssessments';
import { AssessmentQuestion } from '@/types/assessmentTypes';
import QuestionCard from '@/components/assessments/QuestionCard';
import QuestionForm from '@/components/assessments/QuestionForm';
import AssignTemplateDialog from '@/components/assessments/AssignTemplateDialog';
import { useAuth } from '@/contexts/auth/AuthContext';
import { ArrowLeft, Plus, FileUp, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AssessmentTemplate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const {
    getTemplateById,
    addQuestion,
    updateQuestion,
    removeQuestion,
    getAssignmentsByTemplate,
    assignTemplate
  } = useAssessments();
  
  const [template, setTemplate] = useState(id ? getTemplateById(id) : null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState(id ? getAssignmentsByTemplate(id) : []);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  useEffect(() => {
    if (id) {
      const foundTemplate = getTemplateById(id);
      if (!foundTemplate) {
        navigate('/assessments');
        return;
      }
      setTemplate(foundTemplate);
      setAssignments(getAssignmentsByTemplate(id));
    }
  }, [id, getTemplateById, navigate, getAssignmentsByTemplate]);

  if (!template) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Template not found</h2>
            <Button onClick={() => navigate('/assessments')}>Back to Assessments</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddQuestion = (question: Omit<AssessmentQuestion, 'id'>) => {
    const newQuestion = addQuestion(template.id, question);
    setShowQuestionForm(false);
    
    toast({
      title: "Question added",
      description: "The question has been added to the template."
    });
    
    // Refresh template data
    setTemplate(getTemplateById(template.id)!);
  };
  
  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      removeQuestion(template.id, questionId);
      
      toast({
        title: "Question deleted",
        description: "The question has been removed from the template."
      });
      
      // Refresh template data
      setTemplate(getTemplateById(template.id)!);
    }
  };
  
  const handleEditQuestion = (questionId: string) => {
    // In a real implementation, we'd show an edit form
    // For now, we'll just show an alert
    alert('Edit functionality would be implemented here');
    setEditingQuestionId(questionId);
  };
  
  const handleAssignTemplate = (userIds: string[], dueDate?: Date) => {
    const newAssignments = assignTemplate(template.id, userIds, dueDate);
    
    toast({
      title: "Template assigned",
      description: `Assessment assigned to ${userIds.length} user(s).`
    });
    
    setShowAssignDialog(false);
    
    // Refresh assignments
    setAssignments(getAssignmentsByTemplate(template.id));
  };

  const getStatusBadge = () => {
    switch (template.status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Draft</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => navigate('/assessments')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {template.name} {getStatusBadge()}
            </h1>
            <p className="text-muted-foreground">
              {template.description || "No description provided"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowAssignDialog(true)}
              className="flex items-center gap-2"
              disabled={template.questions.length === 0}
            >
              <Users className="h-4 w-4" />
              Assign
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Questions</CardTitle>
                  <CardDescription>
                    {template.questions.length} question{template.questions.length !== 1 ? 's' : ''} in this template
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowQuestionForm(true)}
                  disabled={showQuestionForm}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {template.questions.length === 0 && !showQuestionForm ? (
                <div className="text-center p-8 bg-muted/20 rounded-md">
                  <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium mb-1">No Questions Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add yes/no questions to create your assessment template
                  </p>
                  <Button onClick={() => setShowQuestionForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add First Question
                  </Button>
                </div>
              ) : (
                <>
                  {/* Question list */}
                  {template.questions.map(question => (
                    <QuestionCard 
                      key={question.id}
                      question={question}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                  
                  {/* Add question form */}
                  {showQuestionForm && (
                    <QuestionForm 
                      onAddQuestion={handleAddQuestion} 
                      onCancel={() => setShowQuestionForm(false)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Assignments</CardTitle>
            <CardDescription>
              {assignments.length} user{assignments.length !== 1 ? 's' : ''} assigned to this assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 rounded-md">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium mb-1">No Assignments</h3>
                <p className="text-muted-foreground mb-4">
                  This assessment hasn't been assigned to anyone yet
                </p>
                <Button 
                  onClick={() => setShowAssignDialog(true)}
                  disabled={template.questions.length === 0}
                >
                  <Users className="h-4 w-4 mr-1" /> Assign Template
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">
                  This template has been assigned to {assignments.length} user{assignments.length !== 1 ? 's' : ''}
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <Users className="h-4 w-4 mr-1" /> Assign to More Users
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Assign template dialog */}
      <AssignTemplateDialog 
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssign={handleAssignTemplate}
        templateName={template.name}
      />
    </Layout>
  );
};

export default AssessmentTemplate;
