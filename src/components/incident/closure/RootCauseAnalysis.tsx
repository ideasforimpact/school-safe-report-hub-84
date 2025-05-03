
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface RootCauseAnalysisProps {
  rootCause: string;
  setRootCause: (value: string) => void;
}

const RootCauseAnalysis: React.FC<RootCauseAnalysisProps> = ({
  rootCause,
  setRootCause
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Root Cause Analysis</h3>
      <p className="text-sm text-gray-600">
        Identify the fundamental reason this incident occurred
      </p>
      <Textarea
        value={rootCause}
        onChange={(e) => setRootCause(e.target.value)}
        placeholder="What was the primary cause of this incident?"
        className="min-h-[100px]"
        required
      />
    </div>
  );
};

export default RootCauseAnalysis;
