
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Save, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import QuestionResponseItem from './QuestionResponseItem';
import { QuestionResponse } from '@/types/assessment';

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
      return !response; // No response found for this required question
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
      } else {
        // Create new response
        createResponse({
          assignmentId: assignment.id,
          templateId: template.id,
          userId: user.id,
          responses: questionResponses
        });
      }
      
      // Show success message or toast
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!template || !assignment || !user) return;
    if (!validateResponses()) return;
    
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
      
      // Navigate to assignments list with success message
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">{template.title}</h2>
          <p className="text-gray-500">{template.description}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          ) : isOverdue ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              Due {new Date(assignment.dueDate).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Assessment Questions */}
      <div className="space-y-4">
        {template.questions.map((question, index) => (
          <QuestionResponseItem
            key={question.id}
            question={question}
            response={questionResponses.find(r => r.questionId === question.id)}
            index={index}
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
      
      {!isCompleted && (
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/assessments/assignments')}
          >
            Back to Assignments
          </Button>
          
          <div className="space-x-3">
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
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {isCompleted && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            onClick={() => navigate('/assessments/assignments')}
          >
            Back to Assignments
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssessmentResponseForm;
