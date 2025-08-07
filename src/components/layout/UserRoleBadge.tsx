
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User } from "lucide-react";
import { formatDepartment } from "@/lib/formatUtils";

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
  // Log values for debugging
  console.log("UserRoleBadge Props:", { isSaasOwner, isAdmin, isSuperAdmin, department });
  
  // If user is logged in through backoffice, they are a SaaS Owner
  if (isSaasOwner) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1">
        <Crown className="h-3 w-3" />
        SaaS Owner {department ? `(${formatDepartment(department)})` : ''}
      </Badge>
    );
  }
  
  // If user is logged in as employee and is a super admin
  if (isSuperAdmin) {
    return (
      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Super Admin {department ? `(${formatDepartment(department)})` : ''}
      </Badge>
    );
  }
  
  // If user is a regular admin
  if (isAdmin) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Admin {department ? `(${formatDepartment(department)})` : ''}
      </Badge>
    );
  }
  
  // If we have a department but user is not any type of admin
  if (department) {
    return (
      <Badge variant="default" className="bg-gray-600 hover:bg-gray-700 flex items-center gap-1">
        <User className="h-3 w-3" />
        {formatDepartment(department)}
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
