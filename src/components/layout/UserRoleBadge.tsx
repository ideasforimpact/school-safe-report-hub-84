
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User } from "lucide-react";
import { useEmployeeDepartments } from "@/hooks/useEmployeeDepartments";
import { employeeDepartmentName } from "@/services/employeeNameHelpers";


interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  department?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Persists across re-mounts and the brief department=undefined window during
// route transitions so the badge never drops back to no label.
let _lastResolvedLabel = '';

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  isSaasOwner,
  isAdmin,
  isSuperAdmin = false,
  department,
}) => {
  const { employeeDepartments, loading } = useEmployeeDepartments();

  const isUuid = !!department && UUID_RE.test(department.trim());

  const resolved = isUuid
    ? loading
      ? ''
      : employeeDepartmentName(department, employeeDepartments)
    : (department?.trim() || '');

  if (resolved && resolved !== 'Not Specified') {
    _lastResolvedLabel = resolved;
  }

  const departmentLabel = _lastResolvedLabel;

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
