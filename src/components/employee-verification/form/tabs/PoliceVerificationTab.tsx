
import React, { useState } from 'react';
import { Shield, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PoliceVerificationTabProps {
  employeeId: string;
  onSubmit?: () => void;
}

const PoliceVerificationTab: React.FC<PoliceVerificationTabProps> = ({ 
  employeeId, 
  onSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePoliceVerificationSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement police verification submission logic
      await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API call
      
      toast({
        title: 'Police Verification Requested',
        description: 'Police verification request has been submitted for the employee.',
      });
      
      if (onSubmit) onSubmit();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit police verification request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Police Verification</h3>
        <p className="text-gray-600 text-sm">
          Submit a request for police background verification of the employee
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-medium text-purple-900 mb-4">Verification Process</h4>
        <div className="space-y-3">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <h5 className="font-medium text-purple-900">Address Verification</h5>
              <p className="text-sm text-purple-700">Local police will verify current and permanent addresses</p>
            </div>
          </div>
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <h5 className="font-medium text-purple-900">Criminal Record Check</h5>
              <p className="text-sm text-purple-700">Background check for any criminal history or pending cases</p>
            </div>
          </div>
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <h5 className="font-medium text-purple-900">Processing Time</h5>
              <p className="text-sm text-purple-700">Typically takes 7-15 working days for completion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">Required Information</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Employee's current address details</li>
          <li>• Permanent address information</li>
          <li>• Identity proof documents</li>
          <li>• Character references (if required)</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handlePoliceVerificationSubmit}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Police Verification'}
        </Button>
      </div>
    </div>
  );
};

export default PoliceVerificationTab;
