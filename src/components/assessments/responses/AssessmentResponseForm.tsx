
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Save, 
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import QuestionResponseItem from './QuestionResponseItem';
import { QuestionResponse } from '@/types/assessment';
import { toast } from "sonner";
import { Progress } from '@/components/ui/progress';

const AssessmentResponseForm = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { 
    templates, 
    assignments, 
    responses, 
    createResponse, 
    updateResponse, 
    submitResponse 
  } = useAssessment();
  const { user } = useAuth();
  
  const [formError, setFormError] = useState<string | null>(null);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Get assignment, template, and existing response data
  const assignment = assignmentId ? assignments.find(a => a.id === assignmentId) : null;
  const template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  const existingResponse = assignment 
    ? responses.find(r => r.assignmentId === assignment.id && r.userId === user?.id)
    : null;
  
  // Initialize form with existing response data or empty values
  useEffect(() => {
    if (template && assignment) {
      if (existingResponse) {
        // Use existing responses
        setQuestionResponses(existingResponse.responses);
      } else {
        // Create empty responses for each question
        const emptyResponses = template.questions.map(question => ({
          questionId: question.id,
          answer: false,
          comment: null,
          attachments: null
        }));
        setQuestionResponses(emptyResponses);
      }
    }
  }, [template, assignment, existingResponse]);
  
  // If no assignment or template found, redirect to assignments list
  useEffect(() => {
    if (!assignmentId) {
      navigate('/assessments/assignments');
      return;
    }
    
    if (assignmentId && (!assignment || !template)) {
      navigate('/assessments/assignments');
    }
  }, [assignmentId, assignment, template, navigate]);
  
  const handleResponseChange = (questionId: string, field: string, value: any) => {
    setQuestionResponses(prev => 
      prev.map(response => 
        response.questionId === questionId 
          ? { ...response, [field]: value } 
          : response
      )
    );
  };
  
  const validateResponses = () => {
    if (!template) return false;
    
    // Check if all required questions have been answered
    const requiredQuestions = template.questions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.some(requiredQ => {
      const response = questionResponses.find(r => r.questionId === requiredQ.id);
      return response?.answer === undefined; // No answer for this required question
    });
    
    if (unansweredRequired) {
      setFormError('Please answer all required questions');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleSave = async () => {
    if (!template || !assignment || !user) return;
    
    setSaving(true);
    
    try {
      if (existingResponse) {
        // Update existing response
        updateResponse(existingResponse.id, {
          responses: questionResponses
        });
        toast.success("Progress saved successfully");
      } else {
        // Create new response
        createResponse({
          assignmentId: assignment.id,
          templateId: template.id,
          userId: user.id,
          responses: questionResponses
        });
        toast.success("Response created and saved");
      }
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!template || !assignment || !user) return;
    if (!validateResponses()) {
      toast.error("Please complete all required questions before submitting");
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (existingResponse) {
        // Update responses first
        updateResponse(existingResponse.id, {
          responses: questionResponses
        });
        
        // Then submit
        submitResponse(existingResponse.id);
      } else {
        // Create new response
        const responseId = createResponse({
          assignmentId: assignment.id,
          templateId: template.id,
          userId: user.id,
          responses: questionResponses
        });
        
        // Then submit
        submitResponse(responseId);
      }
      
      // Show success message
      toast.success("Assessment submitted successfully!");
      
      // Navigate to assignments list
      navigate('/assessments/assignments');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!assignment || !template) {
    return null;
  }
  
  const isCompleted = existingResponse?.status === 'Submitted';
  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'Completed';

  // Calculate progress
  const totalQuestions = template.questions.length;
  const answeredQuestions = questionResponses.filter(r => r.answer !== undefined).length;
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  // Group questions into sections of 5 for easier navigation
  const QUESTIONS_PER_PAGE = 5;
  const groupedQuestions = [];
  for (let i = 0; i < template.questions.length; i += QUESTIONS_PER_PAGE) {
    groupedQuestions.push(template.questions.slice(i, i + QUESTIONS_PER_PAGE));
  }
  
  const currentQuestions = groupedQuestions[currentSection] || [];
  const isFirstSection = currentSection === 0;
  const isLastSection = currentSection === groupedQuestions.length - 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-semibold">{template.title}</h2>
          <p className="text-gray-500">{template.description}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <Badge className={isCompleted ? "bg-green-100 text-green-800" : 
                            isOverdue ? "bg-red-100 text-red-800" : 
                            "bg-blue-100 text-blue-800"}>
            {isCompleted ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
            ) : isOverdue ? (
              <><AlertCircle className="h-3 w-3 mr-1" /> Overdue</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Due {new Date(assignment.dueDate).toLocaleDateString()}</>
            )}
          </Badge>
          
          {!isCompleted && (
            <div className="w-full sm:w-36">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>
      </div>
      
      {groupedQuestions.length > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">
            Section {currentSection + 1} of {groupedQuestions.length}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
              disabled={isFirstSection}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentSection(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
              disabled={isLastSection}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Assessment Questions */}
      <div className="space-y-4">
        {currentQuestions.map((question, index) => (
          <QuestionResponseItem
            key={question.id}
            question={question}
            response={questionResponses.find(r => r.questionId === question.id)}
            index={index + (currentSection * QUESTIONS_PER_PAGE)}
            onChange={handleResponseChange}
            readOnly={isCompleted}
          />
        ))}
      </div>
      
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <p className="text-sm">{formError}</p>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/assessments/assignments')}
        >
          Back to Assignments
        </Button>
        
        <div className="flex space-x-3">
          {!isCompleted && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSave} 
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Submit
              </Button>
            </>
          )}
          
          {!isLastSection && (
            <Button 
              type="button"
              onClick={() => setCurrentSection(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
              disabled={isLastSection}
            >
              Next Section
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResponseForm;
