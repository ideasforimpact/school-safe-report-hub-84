
import React, { useState } from 'react';
import { TestTube, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DrugTestTabProps {
  employeeId: string;
  onSubmit?: () => void;
}

const DrugTestTab: React.FC<DrugTestTabProps> = ({ 
  employeeId, 
  onSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDrugTestSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement drug test submission logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast({
        title: 'Drug Test Requested',
        description: 'Drug test request has been submitted for the employee.',
      });
      
      if (onSubmit) onSubmit();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit drug test request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <TestTube className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Drug Test</h3>
        <p className="text-gray-600 text-sm">
          Submit a request for employee drug testing through authorized testing centers
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-medium text-green-900 mb-3">Drug Testing Process</h4>
        <ul className="text-sm text-green-700 space-y-2">
          <li>• Employee will be contacted for test scheduling</li>
          <li>• Test will be conducted at authorized testing facility</li>
          <li>• Results will be available within 24-48 hours</li>
          <li>• Report will be directly sent to HR department</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <h5 className="font-medium text-yellow-900 mb-1">Important Note</h5>
            <p className="text-sm text-yellow-700">
              Employee consent is required before conducting drug test. Ensure proper authorization 
              and compliance with company policies.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleDrugTestSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Drug Test'}
        </Button>
      </div>
    </div>
  );
};

export default DrugTestTab;
