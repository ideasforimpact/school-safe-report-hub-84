
import React, { useState } from 'react';
import { Scale, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CourtCaseCheckTabProps {
  employeeId: string;
  onSubmit?: () => void;
}

const CourtCaseCheckTab: React.FC<CourtCaseCheckTabProps> = ({ 
  employeeId, 
  onSubmit 
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCourtCaseCheck = async () => {
    setIsChecking(true);
    try {
      // TODO: Implement court case check logic
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      
      toast({
        title: 'Court Case Check Initiated',
        description: 'Court case verification has been initiated through E Court.',
      });
      
      if (onSubmit) onSubmit();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate court case check. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Court Case Check</h3>
        <p className="text-gray-600 text-sm">
          Verify if the employee has any pending or past court cases through E Court services
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-blue-900">E Court Verification</h4>
        </div>
        <p className="text-blue-700 text-sm mb-4">
          This will check the employee's details against E Court records to identify any legal proceedings.
        </p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Criminal case records</li>
          <li>• Civil case records</li>
          <li>• Pending litigation status</li>
          <li>• Court judgments and orders</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleCourtCaseCheck}
          disabled={isChecking}
          className="bg-blue-600 hover:bg-blue-700 px-8"
        >
          {isChecking ? 'Checking...' : 'Check for Court Cases through E Court'}
        </Button>
      </div>
    </div>
  );
};

export default CourtCaseCheckTab;
