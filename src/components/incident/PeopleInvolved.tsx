
import React from 'react';
import { Person } from '@/types/incident';
import { Users } from 'lucide-react';

interface PeopleInvolvedProps {
  people: Person[];
}

const PeopleInvolved: React.FC<PeopleInvolvedProps> = ({ people }) => {
  return (
    <div>
      <div className="flex items-start space-x-2 mb-3">
        <Users className="h-5 w-5 text-primary-600 mt-0.5" />
        <h3 className="font-medium">People Involved</h3>
      </div>
      
      {people && people.length > 0 ? (
        <div className="space-y-3">
          {people.map((person, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between">
                <p className="font-medium">{person.name}</p>
                <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                  {person.role}
                </span>
              </div>
              {person.notes && (
                <p className="text-sm text-gray-600 mt-1">{person.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No people recorded for this incident</p>
      )}
    </div>
  );
};

export default PeopleInvolved;
