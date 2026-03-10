import React from 'react';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';

interface LearningPointsProps {
  learningPoints: string;
  setLearningPoints: (value: string) => void;
}

const LearningPoints: React.FC<LearningPointsProps> = ({
  learningPoints,
  setLearningPoints
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Learning Points (Optional)</h3>
      <p className="text-sm text-gray-600">
        Document key learnings and insights from this incident
      </p>
      <div className="space-y-2">
        <TextareaWithVoice
          value={learningPoints}
          onChange={(e) => setLearningPoints(e.target.value)}
          placeholder="What can we learn from this incident to prevent similar issues in the future?"
          className="min-h-[100px]"
          maxLength={200}
        />
        <div className="text-right text-sm text-gray-500">
          {learningPoints.length}/200 characters
        </div>
      </div>
    </div>
  );
};

export default LearningPoints;
