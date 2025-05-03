
import React from 'react';
import { Action } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

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
  setCurrentAction,
  addAction,
  removeAction
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Actions Taken</h3>
      <p className="text-sm text-gray-600">
        List all actions taken to resolve this incident
      </p>
      
      {/* Simplified Add Action Form */}
      <div className="space-y-3 border rounded-md p-3 bg-slate-50">
        <div>
          <label className="text-sm font-medium">Action Description</label>
          <Textarea
            placeholder="Describe what was done to address the incident"
            value={currentAction.description}
            onChange={(e) => setCurrentAction(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={addAction}
            disabled={!currentAction.description}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
      
      {/* Actions List */}
      {actions.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Added Actions:</h4>
          {actions.map((action, index) => (
            <div key={index} className="flex items-start justify-between bg-white p-3 border rounded-md">
              <div className="space-y-1">
                <p>{action.description}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700"
                onClick={() => removeAction(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsTakenForm;
