
import React from 'react';
import { Person } from '@/types/incident';
import { Users } from 'lucide-react';

interface PeopleInvolvedProps {
  people: Person[];
}

const PeopleInvolved: React.FC<PeopleInvolvedProps> = ({ people }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-5 w-5 text-primary-600" />
        <h3 className="font-medium">People Involved</h3>
      </div>
      
      {people && people.length > 0 ? (
        <div className="space-y-2">
          {people.map((person, index) => (
            <div key={index} className="flex flex-col space-y-1 border-b pb-2 last:border-b-0">
              <div className="flex items-center">
                <span className="font-medium">{person.name || 'Unnamed'}</span>
                <span className="text-xs ms-3 px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                  {person.role}
                </span>
              </div>
              {person.notes && (
                <p className="text-sm text-gray-600">{person.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No people recorded for this incident</p>
      )}
    </div>
  );
};

export default PeopleInvolved;
