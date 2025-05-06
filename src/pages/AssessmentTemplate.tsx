
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useTemplateDetail } from '@/hooks/useTemplateDetail';
import TemplateHeader from '@/components/assessments/template/TemplateHeader';
import TemplateAlerts from '@/components/assessments/template/TemplateAlerts';
import QuestionsSection from '@/components/assessments/template/QuestionsSection';
import AssignmentsSection from '@/components/assessments/template/AssignmentsSection';
import AssignTemplateDialog from '@/components/assessments/AssignTemplateDialog';

const AssessmentTemplate = () => {
  const { id } = useParams<{ id: string }>();
  
  const {
    template,
    assignments,
    isCompleted,
    isActive,
    showAssignDialog,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    handleAssignTemplate,
    handleActivateTemplate,
    setShowAssignDialog
  } = useTemplateDetail(id);

  if (!template) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Template not found</h2>
            <p className="mb-4 text-muted-foreground">The template you're looking for could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        {/* Template Header */}
        <TemplateHeader 
          template={template}
          isCompleted={isCompleted}
          isActive={isActive}
          onActivate={handleActivateTemplate}
          onAssign={() => setShowAssignDialog(true)}
        />
        
        {/* Status Alerts */}
        <TemplateAlerts 
          questionsCount={template.questions.length}
          isActive={isActive}
        />
        
        {/* Questions Section */}
        <QuestionsSection 
          template={template}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
        />
        
        {/* Assignments Section */}
        <AssignmentsSection 
          assignmentsCount={assignments.length}
          questionsCount={template.questions.length}
          onAssign={() => setShowAssignDialog(true)}
        />
        
        {/* Assign template dialog */}
        <AssignTemplateDialog 
          open={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          onAssign={handleAssignTemplate}
          templateName={template.name}
        />
      </div>
    </Layout>
  );
};

export default AssessmentTemplate;
