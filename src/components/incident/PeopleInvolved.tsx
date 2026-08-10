
import React from 'react';
import { Person } from '@/types/incident';
import { Users } from 'lucide-react';
import StudentOriginBadge from '@/components/common/StudentOriginBadge';

interface PeopleInvolvedProps {
  people: Person[];
}

const PeopleInvolved: React.FC<PeopleInvolvedProps> = ({ people }) => {
  // Only worth distinguishing origins when this incident actually involves an external
  // student. Derived from the saved records, so it stays correct after unlinking - and
  // stays silent for clients that never linked at all.
  const hasExternalStudent = (people || []).some(person => person.is_external === true);

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
                <span className="font-medium">
                  {person.aadhar_verified_name || person.name || 'Unnamed'}
                </span>
                {person.role === 'Staff' && person.aadhar_verified_name && (
                  <span className="text-xs ms-2 px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded">
                    Aadhar Verified
                  </span>
                )}
                <span className="text-xs ms-3 px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                  {person.role}
                </span>
                {/* Origin comes from the flag saved with the incident, so it stays
                    accurate even if the client has since unlinked the other school */}
                {person.role === 'Student' && (
                  <StudentOriginBadge
                    isExternal={person.is_external}
                    showWhenInternal={hasExternalStudent}
                    className="ms-2"
                  />
                )}
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
