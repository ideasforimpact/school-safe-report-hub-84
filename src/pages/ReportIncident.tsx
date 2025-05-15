
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import { Employee } from '@/contexts/employee/types';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import ReportIncidentHeader from '@/components/incidents/ReportIncidentHeader';
import ReportIncidentForm from '@/components/incidents/ReportIncidentForm';

const ReportIncident = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  
  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        console.log("Fetching employees from API service...");
        const fetchedEmployees = await getAllEmployeesFromApi();
        console.log(`Fetched ${fetchedEmployees.length} employees successfully:`, fetchedEmployees);
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Could not load staff members");
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <ReportIncidentHeader />
        <ReportIncidentForm 
          employees={employees} 
          isLoadingEmployees={isLoadingEmployees} 
        />
      </div>
    </Layout>
  );
};

export default ReportIncident;
