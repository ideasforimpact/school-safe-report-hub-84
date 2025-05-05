
interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
}

const UserRoleBadge = ({ isSaasOwner, isAdmin }: UserRoleBadgeProps) => {
  // Only show the Admin badge for school admins, not for SaaS owners
  // SaaS owners shouldn't be using the school admin interface
  if (isSaasOwner) return null;
  
  return (
    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 hidden md:inline-flex">
      {isAdmin ? 'Admin' : 'Reporter'}
    </span>
  );
};

export default UserRoleBadge;
