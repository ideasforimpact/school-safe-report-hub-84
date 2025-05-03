
import { User, UserRole, ModulePermissions, UserWithPassword } from './types';
import { toast } from "@/components/ui/sonner";

export function validateUserEmail(users: UserWithPassword[], email: string, currentUserId?: string): boolean {
  const emailExists = users.some(u => u.email === email && (currentUserId ? u.id !== currentUserId : true));
  if (emailExists) {
    toast.error("A user with this email already exists");
    return false;
  }
  return true;
}

export function validateAdminDeletion(users: UserWithPassword[], userId: string, currentUserId: string | undefined): boolean {
  // Prevent deleting the last admin
  const admins = users.filter(u => u.role === 'admin');
  const targetUser = users.find(u => u.id === userId);
  
  if (targetUser?.role === 'admin' && admins.length <= 1) {
    toast.error("Cannot delete the last admin user");
    return false;
  }

  // Prevent self-deletion
  if (currentUserId === userId) {
    toast.error("You cannot delete your own account");
    return false;
  }

  return true;
}

export function excludePasswordFromUser(user: UserWithPassword): User {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function excludePasswordFromUsers(users: UserWithPassword[]): User[] {
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}
