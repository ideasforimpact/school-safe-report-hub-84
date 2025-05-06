
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { Award, CheckSquare, FileText, PlusCircle, Users, ListFilter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import NewTemplateDialog from "@/components/assessments/NewTemplateDialog";
import { useAssessments } from "@/hooks/useAssessments";
import { AssessmentTemplate } from "@/types/assessmentTypes";

const Assessments = () => {
  const navigate = useNavigate();
  const { templates, createTemplate, updateTemplateStatus } = useAssessments();
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleCreateTemplate = (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate = createTemplate(templateData);
    setIsNewTemplateDialogOpen(false);
    navigate(`/assessment/${newTemplate.id}`);
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
  
  const getStatusBadge = (status: string) => {
    switch (status) {
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Assessments
            </h1>
            <p className="text-muted-foreground">
              Manage and view safety and compliance assessments
            </p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setIsNewTemplateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            New Assessment
          </Button>
        </div>

        {templates.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Assessment Templates</CardTitle>
              <CardDescription>
                Create and manage your assessment templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px] cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Template Name
                        {sortField === 'name' && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">
                        Created
                        {sortField === 'createdAt' && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getStatusBadge(template.status)}</TableCell>
                      <TableCell>{template.questions.length}</TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/assessment/${template.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Assessment Types */}
            <Card className="overflow-hidden border hover:border-blue-200 transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-blue-50 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Safety Audit
                </CardTitle>
                <CardDescription>Comprehensive facility safety review</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Building safety compliance</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Emergency preparedness</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Hazardous materials handling</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setIsNewTemplateDialogOpen(true)}
                >
                  Start New Audit
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border hover:border-purple-200 transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-purple-50 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Threat Assessment
                </CardTitle>
                <CardDescription>Identify and evaluate potential threats</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Security vulnerability analysis</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Risk factor evaluation</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Mitigation strategy development</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setIsNewTemplateDialogOpen(true)}
                >
                  Begin Assessment
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border hover:border-emerald-200 transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-emerald-50 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Compliance Check
                </CardTitle>
                <CardDescription>Regulatory compliance validation</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Policy implementation review</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Documentation verification</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Training record validation</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setIsNewTemplateDialogOpen(true)}
                >
                  Start Compliance Check
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {templates.length === 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                View and manage your recently completed or in-progress assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                No assessments completed yet. Start a new assessment to begin.
              </div>
            </CardContent>
          </Card>
        )}
        
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
