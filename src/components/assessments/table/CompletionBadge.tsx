
import { Badge } from "@/components/ui/badge";
import { AssessmentTemplate } from "@/types/assessmentTypes";

interface CompletionBadgeProps {
  template: AssessmentTemplate;
}

const CompletionBadge = ({ template }: CompletionBadgeProps) => {
  if (template.questions.length === 0) {
    return <Badge variant="outline" className="text-red-500 border-red-500">Incomplete</Badge>;
  }
  return <Badge variant="outline" className="text-green-500 border-green-500">Complete</Badge>;
};

export default CompletionBadge;
