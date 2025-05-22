
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmployeeProps {
  employee: {
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    employee_type?: string;
    is_super_admin: boolean;
    client_name: string;
  };
}

const EmployeeDetailsTab = ({ employee }: EmployeeProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">First Name</p>
              <p className="font-medium">{employee.first_name}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Last Name</p>
              <p className="font-medium">{employee.last_name}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="font-medium">{employee.client_name}</p>
            </div>
            
            {employee.department && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
            )}
            
            {employee.employee_type && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Employee Type</p>
                <p className="font-medium">{employee.employee_type}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Admin Status</p>
              <p className="font-medium">{employee.is_super_admin ? 'Super Admin' : 'Regular User'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetailsTab;
