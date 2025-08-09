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

  const fetchEmployees = useCallback(async (): Promise<Employee[]> => {
    try {
      const clientId = getClientId();
      
      if (!clientId) {
        console.log('No client ID available, skipping employee fetch');
        setEmployees([]);
        return [];
      }

      console.log('Fetching employees for client:', clientId);
      
      // SECURITY: Always pass clientId to ensure proper filtering
      // The enhanced API now includes document summaries
      const employeesData = await getAllEmployeesFromApi(clientId, false);
      
      console.log(`Successfully loaded ${employeesData.length} employees with documents for client: ${clientId}`);
      
      // Log document counts for debugging
      employeesData.forEach(emp => {
        const docCount = emp.documents?.length || 0;
        const verifiedCount = emp.documents?.filter(doc => doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed').length || 0;
        console.log(`Employee ${emp.name}: ${docCount} documents, ${verifiedCount} verified`);
      });

      setEmployees(employeesData);
      return employeesData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
      return [];
    }
  }, [getClientId]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Implementation for adding employees would go here
    // This would need to be implemented based on your specific requirements
    console.log('Add employee not implemented yet:', employeeData);
    throw new Error('Add employee functionality not implemented');
  }, []);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      console.log('Updating employee:', id, 'with updates:', updates);
      
      // For now, we'll just update the local state since the main functionality 
      // is document verification, not employee management
      setEmployees(prev => prev.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      ));
      
      // TODO: Implement actual database update if needed
      // const { error } = await supabase
      //   .from('employees')
      //   .update(updates)
      //   .eq('id', id);
      // if (error) throw error;
      
      console.log('Employee updated successfully in local state');
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
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
