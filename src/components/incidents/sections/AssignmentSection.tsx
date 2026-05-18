import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignmentSectionProps {
  owner: string;
  onSelectChange: (name: string, value: string) => void;
  isLoading?: boolean;
  employees?: Employee[];
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  onSelectChange,
  isLoading = false,
  employees: propEmployees
}) => {
  const { employeeData } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Update local employees state when prop changes
  useEffect(() => {
    if (propEmployees && propEmployees.length > 0) {
      setEmployees(propEmployees);
      setIsLoadingEmployees(false);
    }
  }, [propEmployees]);

  // Fetch employees based on client_id - only if not provided by prop
    const fetchEmployees = useCallback(async () => {
      if (propEmployees && propEmployees.length > 0) return;
      if (!employeeData?.clientId) {
        setIsLoadingEmployees(false);
        return;
      }

      try {
        setIsLoadingEmployees(true);
        console.log('Fetching employees for client:', employeeData.clientId);

        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email')
          .eq('client_id', employeeData.clientId)
          .eq('status', true)
          .not('email', 'is', null)
          .neq('email', '');

        if (error) throw error;

        setEmployees(
          data.map(emp => ({
            id: emp.id,
            firstName: emp.first_name,
            lastName: emp.last_name,
            email: emp.email || '',
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error('Failed to load employees');
      } finally {
        setIsLoadingEmployees(false);
      }
    }, [employeeData?.clientId, propEmployees]);

    useEffect(() => {
      if (!propEmployees || propEmployees.length === 0) {
        fetchEmployees();
      }
    }, [fetchEmployees, propEmployees]);

    const handleEmployeesRealtime = useCallback(async () => {
      console.log('real time update', employeeData?.clientId);
      if (!propEmployees || propEmployees.length === 0) {
        await fetchEmployees();
      }
    }, [fetchEmployees, employeeData?.clientId, propEmployees]);

    useRealTimeSubHook({
      channelName: 'employees-realtime',
      events: '*',
      table: 'employees',
      enabled: !propEmployees || propEmployees.length === 0,
      onPayload: handleEmployeesRealtime,
    });

  const selectedEmployee = employees.find(emp => emp.id === owner);
  const selectedEmployeeDisplay = selectedEmployee
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}${
        selectedEmployee.email ? ` (${selectedEmployee.email})` : ''
      }`
    : '';

  const handleEmployeeSearch = (value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
  };

  const handleSelectEmployee = (employee: Employee) => {
    onSelectChange('owner', employee.id);
    setIsSearching(false);
    setSearchQuery('');
  };

  // Filter employees based on search query
  const filteredEmployees = searchQuery
    ? employees.filter(employee => {
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`;
        const email = employee.email || '';
        const searchTerm = searchQuery.toLowerCase();

        return (
          fullName.toLowerCase().includes(searchTerm) ||
          email.toLowerCase().includes(searchTerm)
        );
      })
    : employees;

  return (
    <div className="space-y-2 text-left">
      <label htmlFor="owner" className="text-sm font-medium text-left block">
        Assigned to <span className="text-red-500">*</span>
      </label>
      
      {/* Search input for employees */}
      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery || (isSearching ? '' : selectedEmployeeDisplay)}
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
            placeholder={
              isLoading || isLoadingEmployees 
                ? "Loading staff members..." 
                : "Search by name or email..."
            }
            className="w-full pr-8"
            disabled={isLoading || isLoadingEmployees}
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
                  <div>
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                    {employee.email && (
                      <span className="text-gray-500 ml-1">
                        ({employee.email})
                      </span>
                    )}
                  </div>
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
