
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User } from "lucide-react";
import { useEmployeeDepartments } from "@/hooks/useEmployeeDepartments";
import { employeeDepartmentName } from "@/services/employeeNameHelpers";
import { useLocation } from "react-router-dom";


interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  department?: string;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  isSaasOwner, 
  isAdmin,
  isSuperAdmin = false,
  department 
}) => {
  const location = useLocation();
  const isUsersRoute = location.pathname === '/users';
  const isIncidentRoute =
    location.pathname.startsWith('/incidents') ||
    location.pathname.startsWith('/incident/') ||
    location.pathname.startsWith('/report-incident');
  const isAssessmentsRoute =
    location.pathname.startsWith('/assessments') ||
    location.pathname.startsWith('/assessment/');
  const uuidLike = !!department && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(department.trim());
  const needsDepartmentLookup = !isUsersRoute && !isIncidentRoute && !isAssessmentsRoute && uuidLike;
  const { employeeDepartments, loading: departmentsLoading } = useEmployeeDepartments();

  const departmentLabel = departmentsLoading
    ? ''
    : needsDepartmentLookup
      ? employeeDepartmentName(department, employeeDepartments)
      : uuidLike ? '' : (department?.trim() || '');

  // If user is logged in through backoffice, they are a SaaS Owner
  if (isSaasOwner) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1">
        <Crown className="h-3 w-3" />
        SaaS Owner {departmentLabel ? `(${departmentLabel})` : ''}
      </Badge>
    );
  }
  
  // If user is logged in as employee and is a super admin
  if (isSuperAdmin) {
    return (
      <Badge variant="default" className="bg-[#1e40af] hover:bg-[#1e40af] flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Super Admin {departmentLabel ? `(${departmentLabel})` : ''}
      </Badge>
    );
  }
  
  // If user is a regular admin
  if (isAdmin) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Admin {departmentLabel ? `(${departmentLabel})` : ''}
      </Badge>
    );
  }
  
  // If we have a department but user is not any type of admin
  if (department) {
    return (
      <Badge variant="default" className="bg-gray-600 hover:bg-gray-700 flex items-center gap-1">
        <User className="h-3 w-3" />
        {departmentLabel}
      </Badge>
    );
  }
  
  // Default case - regular user with no department
  return (
    <Badge variant="default" className="bg-gray-500 hover:bg-gray-600 flex items-center gap-1">
      <User className="h-3 w-3" />
      User
    </Badge>
  );
};

export default UserRoleBadge;
