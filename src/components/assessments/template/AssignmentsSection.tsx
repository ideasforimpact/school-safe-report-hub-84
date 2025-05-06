
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface AssignmentsSectionProps {
  assignmentsCount: number;
  questionsCount: number;
  onAssign: () => void;
}

const AssignmentsSection = ({ assignmentsCount, questionsCount, onAssign }: AssignmentsSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Assignments</CardTitle>
        <CardDescription>
          {assignmentsCount} user{assignmentsCount !== 1 ? 's' : ''} assigned to this assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignmentsCount === 0 ? (
          <div className="text-center p-8 bg-muted/20 rounded-md">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium mb-1">No Assignments</h3>
            <p className="text-muted-foreground mb-4">
              This assessment hasn't been assigned to anyone yet
            </p>
            <Button 
              onClick={onAssign}
              disabled={questionsCount === 0}
            >
              <Users className="h-4 w-4 mr-1" /> Assign Template
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">
              This template has been assigned to {assignmentsCount} user{assignmentsCount !== 1 ? 's' : ''}
            </p>
            <Button 
              className="mt-4"
              onClick={onAssign}
            >
              <Users className="h-4 w-4 mr-1" /> Assign to More Users
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentsSection;
