
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { Employee } from '../types';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser, getIsBackofficeUser } from '@/store/authSelectors';
import { useSafeClient } from '@/hooks/useSafeClient';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { state } = useEmployeeStore();
  const { client } = useSafeClient();
  
  // Get authentication state from Redux
  const currentUser = getCurrentUser(state);
  const isBackofficeUser = getIsBackofficeUser(state);

  // Determine the client ID to use
  const getClientId = useCallback(() => {
    // For backoffice users, use the selected client from context
    if (isBackofficeUser && client?.id) {
      return client.id;
    }
    
    // For regular users, use their own client ID
    return currentUser?.clientId || null;
  }, [isBackofficeUser, client?.id, currentUser?.clientId]);

  const fetchEmployees = useCallback(async () => {
    try {
      const clientId = getClientId();
      
      if (!clientId) {
        console.log('No client ID available, skipping employee fetch');
        setEmployees([]);
        return;
      }

      console.log('Fetching employees for client:', clientId);
      
      // SECURITY: Always pass clientId to ensure proper filtering
      const employeesData = await getAllEmployeesFromApi(clientId, false);
      
      // Map to our Employee interface
      const mappedEmployees: Employee[] = employeesData.map(emp => ({
        id: emp.id,
        employeeId: emp.employeeId,
        name: emp.name,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || '',
        dateOfBirth: emp.dateOfBirth || '',
        address: emp.address || '',
        joiningDate: emp.joiningDate,
        department: emp.department,
        position: emp.position || '',
        employeeType: emp.employeeType,
        status: emp.status,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
        clientId: emp.clientId,
        documents: emp.documents || []
      }));

      setEmployees(mappedEmployees);
      console.log(`Successfully loaded ${mappedEmployees.length} employees for client: ${clientId}`);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    }
  }, [getClientId]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Implementation for adding employees would go here
    // This would need to be implemented based on your specific requirements
    console.log('Add employee not implemented yet:', employeeData);
    throw new Error('Add employee functionality not implemented');
  }, []);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    // Implementation for updating employees would go here
    console.log('Update employee not implemented yet:', id, updates);
    throw new Error('Update employee functionality not implemented');
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    // Implementation for deleting employees would go here
    console.log('Delete employee not implemented yet:', id);
    throw new Error('Delete employee functionality not implemented');
  }, []);

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  return {
    employees,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
};
