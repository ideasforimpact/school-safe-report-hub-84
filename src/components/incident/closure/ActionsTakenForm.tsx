
import React from 'react';
import { Action } from '@/types/incident';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';

interface ActionsTakenFormProps {
  actions: Action[];
  currentAction: Action;
  setCurrentAction: React.Dispatch<React.SetStateAction<Action>>;
  addAction: () => void;
  removeAction: (index: number) => void;
}

const ActionsTakenForm: React.FC<ActionsTakenFormProps> = ({
  actions,
  currentAction,
  setCurrentAction
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Actions Taken <span className="text-red-500">*</span></h3>
      <p className="text-sm text-gray-600">
        List all actions taken to resolve this incident
      </p>
      <div className="space-y-2">
        <TextareaWithVoice
          placeholder="Describe what was done to address the incident"
          value={currentAction.description}
          onChange={(e) => setCurrentAction(prev => ({ ...prev, description: e.target.value }))}
          className="min-h-[100px]"
          maxLength={200}
        />
        <div className="text-right text-sm text-gray-500">
          {currentAction.description.length}/200 characters
        </div>
      </div>
    </div>
  );
};

export default ActionsTakenForm;
