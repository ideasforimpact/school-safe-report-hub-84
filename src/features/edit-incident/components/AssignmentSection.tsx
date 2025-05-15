
import React, { useEffect, useState } from 'react';
import { User } from '@/types/incident';
import { Employee } from '@/contexts/employee/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentSectionProps {
  owner: string;
  users: User[];
  onSelectChange: (name: string, value: string) => void;
}

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  owner,
  users,
  onSelectChange,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('status', true); // Changed to use boolean value

        if (error) {
          console.error("Error fetching employees:", error);
          return;
        }

        // Map the database employees to our Employee type
        const mappedEmployees = data.map((emp): Employee => ({
          id: emp.id,
          employeeId: emp.employee_id || '',
          firstName: emp.first_name || '',
          lastName: emp.last_name || '',
          email: emp.email || '',
          employeeType: emp.employee_type as any || 'permanent',
          department: emp.department as any || 'admin',
          joiningDate: emp.joining_date || new Date().toISOString(),
          status: 'active',
          createdAt: emp.created_at || new Date().toISOString(),
          updatedAt: emp.updated_at || new Date().toISOString(),
        }));
        
        setEmployees(mappedEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // We'll still use the users array as a fallback if no employees are loaded
  const displayItems = employees.length > 0 
    ? employees 
    : users;

  return (
    <div className="space-y-2">
      <label htmlFor="owner" className="text-sm font-medium">
        Assigned to
      </label>
      <Select 
        value={owner}
        onValueChange={(value) => onSelectChange('owner', value)}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading staff..." : "Assign to staff member (optional)"} />
        </SelectTrigger>
        <SelectContent>
          {employees.length > 0 ? (
            employees.map(employee => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} ({employee.department})
              </SelectItem>
            ))
          ) : (
            users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssignmentSection;
