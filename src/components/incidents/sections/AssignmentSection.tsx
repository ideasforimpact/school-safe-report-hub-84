
import React, { useState } from 'react';
import { Employee } from '@/contexts/employee/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignmentSectionProps {
  owner: string;
  users: Employee[];
  onSelectChange: (name: string, value: string) => void;
  isLoading?: boolean;
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  users,
  onSelectChange,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Find the selected employee
  const selectedEmployee = users.find(emp => emp.id === owner);
  const selectedEmployeeName = selectedEmployee 
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` 
    : '';

  const handleEmployeeSearch = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
  };

  const handleSelectEmployee = (employee: Employee) => {
    onSelectChange('owner', employee.id);
    setShowDropdown(false);
  };

  // Filter employees based on search query
  const filteredEmployees = searchQuery
    ? users.filter(employee => 
        `${employee.firstName} ${employee.lastName} (${employee.department})`.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;

  return (
    <div className="space-y-2 text-left">
      <label htmlFor="owner" className="text-sm font-medium text-left block">
        Assigned to
      </label>
      
      {/* Search input for employees */}
      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery || selectedEmployeeName}
            onChange={(e) => handleEmployeeSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={isLoading ? "Loading staff members..." : "Assign to staff member (optional)"}
            className="w-full pr-8"
            disabled={isLoading}
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {showDropdown && filteredEmployees.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            <ul className="py-1 text-sm">
              {filteredEmployees.map((employee) => (
                <li
                  key={employee.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectEmployee(employee)}
                >
                  {employee.firstName} {employee.lastName} ({employee.department})
                </li>
              ))}
            </ul>
          </div>
        )}

        {showDropdown && searchQuery && filteredEmployees.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <p className="p-3 text-sm text-gray-500">No staff members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSection;
