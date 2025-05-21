
import { Badge } from "@/components/ui/badge";

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
  // Base decisions only on the passed props (which come from Redux)
  if (isSaasOwner) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
        SaaS Owner {department ? `(${department})` : ''}
      </Badge>
    );
  }
  
  if (isAdmin) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Admin {department ? `(${department})` : ''}
      </Badge>
    );
  }
  
  if (department) {
    return (
      <Badge variant="default" className="bg-gray-600 hover:bg-gray-700">
        {department}
      </Badge>
    );
  }
  
  return null;
};

export default UserRoleBadge;
