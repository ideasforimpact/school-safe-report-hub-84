
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AssessmentTemplate } from '@/types/assessmentTypes';

interface TemplateHeaderProps {
  template: AssessmentTemplate;
  isCompleted: boolean;
  isActive: boolean;
  onActivate: () => void;
  onAssign: () => void;
}

const TemplateHeader = ({ 
  template, 
  isCompleted, 
  isActive, 
  onActivate, 
  onAssign 
}: TemplateHeaderProps) => {
  const navigate = useNavigate();
  
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
    <div className="flex items-center mb-6 justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/assessments')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {template.name} {getStatusBadge()}
          </h1>
          <p className="text-muted-foreground">
            {template.description || "No description provided"}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {!isActive && isCompleted && (
          <Button 
            onClick={onActivate}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
          >
            <Play className="h-4 w-4" />
            Activate Template
          </Button>
        )}
        
        <Button 
          variant="outline"
          onClick={onAssign}
          className="flex items-center gap-2"
          disabled={template.questions.length === 0}
        >
          <Users className="h-4 w-4" />
          Assign
        </Button>
      </div>
    </div>
  );
};

export default TemplateHeader;
