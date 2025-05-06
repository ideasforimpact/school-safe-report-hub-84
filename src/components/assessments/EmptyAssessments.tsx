
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EmptyAssessments = () => {
  return (
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
  );
};

export default EmptyAssessments;
