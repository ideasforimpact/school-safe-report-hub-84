
interface UserRoleBadgeProps {
  isSaasOwner: boolean;
  isAdmin: boolean;
}

const UserRoleBadge = ({ isSaasOwner, isAdmin }: UserRoleBadgeProps) => {
  return (
    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 hidden md:inline-flex">
      {isSaasOwner ? 'SaaS Owner' : (isAdmin ? 'Admin' : 'Reporter')}
    </span>
  );
};

export default UserRoleBadge;
