
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, FileText } from "lucide-react";

interface AssessmentTemplateCardsProps {
  onNewAssessment: () => void;
}

const AssessmentTemplateCards = ({ onNewAssessment }: AssessmentTemplateCardsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Safety Audit */}
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
            onClick={onNewAssessment}
          >
            Start New Audit
          </Button>
        </CardContent>
      </Card>

      {/* Threat Assessment */}
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
            onClick={onNewAssessment}
          >
            Begin Assessment
          </Button>
        </CardContent>
      </Card>

      {/* Compliance Check */}
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
            onClick={onNewAssessment}
          >
            Start Compliance Check
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentTemplateCards;
