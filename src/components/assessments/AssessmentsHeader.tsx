
import { Button } from "@/components/ui/button";
import { Award, PlusCircle } from "lucide-react";

interface AssessmentsHeaderProps {
  onNewAssessment: () => void;
}

const AssessmentsHeader = ({ onNewAssessment }: AssessmentsHeaderProps) => {
  return (
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
      <Button className="flex items-center gap-2" onClick={onNewAssessment}>
        <PlusCircle className="h-4 w-4" />
        New Assessment
      </Button>
    </div>
  );
};

export default AssessmentsHeader;
