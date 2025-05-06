import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { useAssessments } from "@/hooks/useAssessments";
import { useToast } from "@/components/ui/use-toast";
import { AssessmentTemplate } from "@/types/assessmentTypes";
import { useNavigate } from "react-router-dom";
import NewTemplateDialog from "@/components/assessments/NewTemplateDialog";
import AssessmentTemplateCards from "@/components/assessments/AssessmentTemplateCards";
import AssessmentTemplatesTable from "@/components/assessments/AssessmentTemplatesTable";
import AssessmentsHeader from "@/components/assessments/AssessmentsHeader";
import EmptyAssessments from "@/components/assessments/EmptyAssessments";

const Assessments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { templates, createTemplate } = useAssessments();
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleCreateTemplate = (
    templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTemplate = createTemplate(templateData, [], undefined);
    setIsNewTemplateDialogOpen(false);
    
    toast({
      title: "Assessment Template Created",
      description: `${newTemplate.name} has been created successfully.`,
    });
    
    // Ensure we're navigating to the correct path and the navigation happens after state updates
    setTimeout(() => {
      navigate(`/assessment/${newTemplate.id}`);
    }, 100);
  };
  
  const handleSort = (field: 'name' | 'createdAt') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedTemplates = [...templates].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <Layout>
      <div className="py-6">
        <AssessmentsHeader onNewAssessment={() => setIsNewTemplateDialogOpen(true)} />

        {templates.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Assessment Templates</CardTitle>
              <CardDescription>
                Create and manage your assessment templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentTemplatesTable 
                templates={sortedTemplates}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </CardContent>
          </Card>
        ) : (
          <AssessmentTemplateCards onNewAssessment={() => setIsNewTemplateDialogOpen(true)} />
        )}
        
        {templates.length === 0 && <EmptyAssessments />}
        
        {/* New Template Dialog */}
        <NewTemplateDialog
          open={isNewTemplateDialogOpen}
          onClose={() => setIsNewTemplateDialogOpen(false)}
          onSave={handleCreateTemplate}
        />
      </div>
    </Layout>
  );
};

export default Assessments;
