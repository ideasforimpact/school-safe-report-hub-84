import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { AssigneeEmployee } from '@/types/assessment';
import { employeeDisplayName } from '@/services/employeeNameHelpers';

interface AssigneeMultiSelectProps {
  employees: AssigneeEmployee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Defaults to the shared Aadhaar-verified-name-first display format. */
  getLabel?: (employee: AssigneeEmployee) => string;
}

const AssigneeMultiSelect: React.FC<AssigneeMultiSelectProps> = ({
  employees,
  selectedIds,
  onChange,
  getLabel = employeeDisplayName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const selectedEmployees = employees.filter(employee => selectedIds.includes(employee.id));

  const filteredEmployees = searchQuery
    ? employees.filter(employee => {
        const label = getLabel(employee);
        const email = employee.email ?? '';
        const searchTerm = searchQuery.toLowerCase();
        const departmentName =
          employee.employee_departments?.department_name || employee.department || '';

        return (
          label.toLowerCase().includes(searchTerm) ||
          email.toLowerCase().includes(searchTerm) ||
          departmentName.toLowerCase().includes(searchTerm)
        );
      })
    : employees;

  const toggleEmployee = (employeeId: string) => {
    if (selectedIds.includes(employeeId)) {
      onChange(selectedIds.filter(id => id !== employeeId));
    } else {
      onChange([...selectedIds, employeeId]);
    }
  };

  const removeEmployee = (employeeId: string) => {
    onChange(selectedIds.filter(id => id !== employeeId));
  };

  return (
    <div className="space-y-2">
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEmployees.map(employee => (
            <Badge key={employee.id} variant="secondary" className="flex items-center gap-1 py-1 pl-2 pr-1">
              {getLabel(employee)}
              <button
                type="button"
                onClick={() => removeEmployee(employee.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                aria-label={`Remove ${getLabel(employee)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            onBlur={() => {
              setTimeout(() => setIsSearching(false), 200);
            }}
            placeholder="Search by name, email, or department..."
            className="w-full pr-8"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {isSearching && filteredEmployees.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            <ul className="py-1 text-sm">
              {filteredEmployees.map(employee => {
                const isSelected = selectedIds.includes(employee.id);
                return (
                  <li
                    key={employee.id}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-purple-50' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleEmployee(employee.id)}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <div>
                      <span className="font-medium">{getLabel(employee)}</span>
                      <span className="text-gray-500 ml-1">({employee.email ?? ''})</span>
                    </div>
                    {isSelected && <span className="text-xs text-purple-700 font-medium">Selected</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isSearching && searchQuery && filteredEmployees.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <p className="p-3 text-sm text-gray-500">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssigneeMultiSelect;
