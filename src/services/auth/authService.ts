
import { User, UserWithPassword } from '@/contexts/auth/types';
import { toast } from "@/components/ui/sonner";
import { INITIAL_MOCK_USERS } from '@/contexts/auth/initialData';

// Core authentication functions
export const getUserFromStorage = (): User | null => {
  const savedUser = localStorage.getItem('user');
  return savedUser ? JSON.parse(savedUser) : null;
};

export const getUsersFromStorage = (): UserWithPassword[] => {
  const savedUsers = localStorage.getItem('users');
  return savedUsers ? JSON.parse(savedUsers) : INITIAL_MOCK_USERS;
};

export const saveUserToStorage = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const saveUsersToStorage = (users: UserWithPassword[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const loginUser = async (
  email: string, 
  password: string, 
  users: UserWithPassword[],
  isEmailDomainAllowed?: (email: string, clientId: string) => boolean
): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log("Attempting login with:", email, password);
  console.log("Available users:", users.map(u => ({ email: u.email, password: u.password })));
  
  // Reset users to initial data if they got corrupted
  let usersToCheck = users;
  if (!users.length || !users.some(u => u.email === "owner@saasplatform.com")) {
    console.log("Resetting users to initial data");
    usersToCheck = INITIAL_MOCK_USERS;
    saveUsersToStorage(usersToCheck);
  }
  
  // Find matching user
  const foundUser = usersToCheck.find(
    u => u.email === email && u.password === password
  );
  
  if (foundUser) {
    // If user isn't a SaaS Owner, validate their email domain against client's allowed domains
    if (foundUser.role !== 'saas_owner' && foundUser.clientId && isEmailDomainAllowed) {
      const isAllowed = isEmailDomainAllowed(email, foundUser.clientId);
      if (!isAllowed) {
        toast.error("Your email domain is not allowed to access this client's portal");
        return null;
      }
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = foundUser;
    toast.success(`Welcome back, ${userWithoutPassword.name}!`);
    return userWithoutPassword;
  }
  
  toast.error("Invalid email or password");
  return null;
};

export const logoutUser = (): void => {
  localStorage.removeItem('user');
  toast.info("You've been logged out");
};

export const changeUserPassword = (
  users: UserWithPassword[],
  userId: string, 
  currentPassword: string, 
  newPassword: string
): UserWithPassword[] | null => {
  // Find user record
  const userRecord = users.find(u => u.id === userId);
  
  if (!userRecord || userRecord.password !== currentPassword) {
    toast.error("Current password is incorrect");
    return null;
  }

  // Update password
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, password: newPassword };
    }
    return u;
  });

  toast.success("Password changed successfully");
  return updatedUsers;
};
