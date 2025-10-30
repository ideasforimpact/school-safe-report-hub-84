
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
      <h3 className="font-medium">Root Cause Analysis <span className="text-red-500">*</span></h3>
      <p className="text-sm text-gray-600">
        Identify the fundamental reason this incident occurred
      </p>
      <div className="space-y-2">
        <Textarea
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="What was the primary cause of this incident?"
          className="min-h-[100px]"
          maxLength={200}
          required
        />
        <div className="text-right text-sm text-gray-500">
          {rootCause.length}/200 characters
        </div>
      </div>
    </div>
  );
};

export default RootCauseAnalysis;
