
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Check } from 'lucide-react';

interface TemplateAlertsProps {
  questionsCount: number;
  isActive: boolean;
}

const TemplateAlerts = ({ questionsCount, isActive }: TemplateAlertsProps) => {
  return (
    <>
      {questionsCount === 0 && (
        <Alert className="mb-6 border-amber-300 bg-amber-50">
          <FileUp className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800">
            This template is incomplete. Add questions below to complete it.
          </AlertDescription>
        </Alert>
      )}
      
      {isActive && (
        <Alert className="mb-6 border-green-300 bg-green-50">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-800">
            This assessment template is active and ready for use.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default TemplateAlerts;
