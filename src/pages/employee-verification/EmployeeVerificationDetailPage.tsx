
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/documents-list';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Employee } from '@/types/employeeVerification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EmployeeVerificationDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee, employees } = useEmployeeVerification();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First try to get from context
        let employeeData = getEmployee(employeeId);
        
        // If not found in context, fetch directly from API
        if (!employeeData) {
          console.log('Employee not found in context, fetching from API...');
          
          const { data, error } = await supabase
            .from('employees')
            .select(`
              id,
              employee_id,
              first_name,
              last_name,
              email,
              employee_type,
              department,
              status,
              client_id,
              is_super_admin,
              user_id,
              joining_date,
              created_at,
              updated_at
            `)
            .eq('id', employeeId)
            .maybeSingle();

          if (error) {
            console.error('Error fetching employee:', error);
            toast.error('Failed to fetch employee details');
            setLoading(false);
            return;
          }

          if (!data) {
            console.log('Employee not found with ID:', employeeId);
            setLoading(false);
            return;
          }

          // Map the database record to our Employee model
          employeeData = {
            id: data.id,
            employeeId: data.employee_id || '',
            name: `${data.first_name} ${data.last_name}`,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email || '',
            phone: '',
            dateOfBirth: '',
            address: '',
            joiningDate: data.joining_date || new Date().toISOString(),
            department: data.department || '',
            position: data.employee_type || '',
            employeeType: (data.employee_type as Employee['employeeType']) || 'permanent',
            status: data.status === true,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
            clientId: data.client_id,
            isSuperAdmin: data.is_super_admin,
            documents: []
          };
        }
        
        setEmployee(employeeData);
      } catch (error) {
        console.error('Error in fetchEmployeeData:', error);
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId, getEmployee]);

  const handleAddDocumentSuccess = () => {
    setAddDocumentOpen(false);
    toast.success('Document added successfully');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading employee details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h2>
            <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/employee-verification')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Employees
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/employee-verification')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
          
          <Dialog open={addDocumentOpen} onOpenChange={setAddDocumentOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
              </DialogHeader>
              <AddDocumentForm 
                employeeId={employee.id}
                onSuccess={handleAddDocumentSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EmployeeDetails employee={employee} />
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-medium mb-4 text-left">Documents</h3>
              <DocumentsList 
                employeeId={employee.id} 
                onAddDocument={() => setAddDocumentOpen(true)}
                initialLoadComplete={true}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationDetailPage;
