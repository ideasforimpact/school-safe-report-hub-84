
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface AssignmentSectionProps {
  owner: string;
  users: UserBasicInfo[];
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
  const [isSearching, setIsSearching] = useState(false);
  
  // Find the selected employee
  const selectedEmployee = users.find(emp => emp.id === owner);
  const selectedEmployeeName = selectedEmployee 
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` 
    : '';

  const handleEmployeeSearch = (value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
  };

  const handleSelectEmployee = (employee: UserBasicInfo) => {
    onSelectChange('owner', employee.id);
    setIsSearching(false);
    setSearchQuery('');
  };

  // Filter employees based on search query
  const filteredEmployees = searchQuery
    ? users.filter(employee => 
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;

  return (
    <div className="space-y-2 text-left">
      <label htmlFor="owner" className="text-sm font-medium text-left block">
        Assigned to <span className="text-red-500">*</span>
      </label>
      
      {/* Search input for employees */}
      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery || (isSearching ? '' : selectedEmployeeName)}
            onChange={(e) => handleEmployeeSearch(e.target.value)}
            onFocus={() => setIsSearching(true)}
            onBlur={() => {
              // Small delay to allow clicking on dropdown items
              setTimeout(() => {
                if (!searchQuery) {
                  setIsSearching(false);
                }
              }, 200);
            }}
            placeholder={isLoading ? "Loading staff members..." : "Select a staff member"}
            className="w-full pr-8"
            disabled={isLoading}
            required
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {isSearching && filteredEmployees.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            <ul className="py-1 text-sm">
              {filteredEmployees.map((employee) => (
                <li
                  key={employee.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectEmployee(employee)}
                  onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click
                >
                  {employee.firstName} {employee.lastName}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSearching && searchQuery && filteredEmployees.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <p className="p-3 text-sm text-gray-500">No staff members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSection;
