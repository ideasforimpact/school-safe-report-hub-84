
import React from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  // Only include properties that are actually used in the component
}

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  onPersonChange: (index: number, field: string, value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  students: Student[];
  employees: UserBasicInfo[]; // Updated to use the generic user type
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson,
  students,
  employees,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">People Involved</h3>
        <button
          type="button"
          onClick={onAddPerson}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Person
        </button>
      </div>

      {peopleInvolved.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          No people added yet. Click "Add Person" to include individuals involved in this incident.
        </div>
      ) : (
        <div className="space-y-4">
          {peopleInvolved.map((person, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 p-3 border rounded-md bg-gray-50">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => onPersonChange(index, 'name', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Full name"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={person.role}
                  onChange={(e) => onPersonChange(index, 'role', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                  <option value="contractor">Contractor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={person.notes || ''} {/* Use notes field instead of type which doesn't exist */}
                  onChange={(e) => onPersonChange(index, 'notes', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select type</option>
                  <option value="witness">Witness</option>
                  <option value="involved">Involved</option>
                  <option value="injured">Injured</option>
                  <option value="reporter">Reporter</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onRemovePerson(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                  aria-label="Remove person"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleInvolvedSection;
