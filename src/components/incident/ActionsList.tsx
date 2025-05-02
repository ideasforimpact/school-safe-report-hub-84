
import React from 'react';
import { Action } from '@/types/incident';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

interface ActionsListProps {
  actions: Action[];
  formatDate: (date: Date) => string;
}

const ActionsList: React.FC<ActionsListProps> = ({
  actions,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Taken</CardTitle>
        <CardDescription>
          Steps taken to address this incident
        </CardDescription>
      </CardHeader>
      <CardContent>
        {actions && actions.length > 0 ? (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="border rounded-md p-4 bg-gray-50">
                <p className="font-medium text-sm">{formatDate(action.date)}</p>
                <p className="mt-1">{action.description}</p>
                <p className="text-sm text-gray-600 mt-1">
                  By: {action.responsiblePerson}
                </p>

                {/* Display action image if available */}
                {action.image && (
                  <div className="mt-3">
                    <img 
                      src={action.image} 
                      alt="Action documentation" 
                      className="w-full h-auto rounded-md border" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No actions recorded yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionsList;
