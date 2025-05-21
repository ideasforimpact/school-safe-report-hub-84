
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  isSaasOwner, 
  isAdmin,
  isSuperAdmin = false // We'll keep the prop but not use it differently
}) => {
  // Base decisions only on the passed props (which come from Redux)
  if (isSaasOwner) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
        SaaS Admin
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
