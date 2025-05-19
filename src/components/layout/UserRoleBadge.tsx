
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  isSaasOwner, 
  isAdmin,
  isSuperAdmin = false
}) => {
  if (isSaasOwner) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
        SaaS Owner
      </Badge>
    );
  }
  
  if (isSuperAdmin) {
    return (
      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
        Super Admin
      </Badge>
    );
  }
  
  if (isAdmin) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Admin
      </Badge>
    );
  }
  
  return null;
};

export default UserRoleBadge;
