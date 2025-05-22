import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Search, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from '@/contexts/auth/types';
import { formatDate } from '@/lib/utils';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  isLoading?: boolean;
  currentClientId?: string | null;
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, isLoading = false, currentClientId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users by search term and potentially by client ID
  const filteredUsers = users.filter(user => {
    // Only apply clientId filter if specified and the user has a clientId
    if (currentClientId && user.clientId && user.clientId !== currentClientId) {
      return false;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchTermLower) ||
      user.lastName.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      (user.department && user.department.toLowerCase().includes(searchTermLower)) ||
      (user.employeeType && user.employeeType.toLowerCase().includes(searchTermLower))
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center px-2 pb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {Array(5).fill(0).map((_, index) => (
                  <TableRow key={index} className="border-b">
                    <TableCell className="p-4"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-10 w-20" /></TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search users..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                    {user.isSuperAdmin && (
                      <Badge variant="outline" className="ml-2 bg-purple-100">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || "—"}</TableCell>
                  <TableCell>
                    {user.employeeType === 'permanent' && <Badge>Permanent</Badge>}
                    {user.employeeType === 'contract' && <Badge variant="outline">Contract</Badge>}
                    {user.employeeType === 'part_time' && <Badge variant="secondary">Part-time</Badge>}
                    {!user.employeeType && "—"}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.joiningDate ? formatDate(user.joiningDate) : "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold">No users found</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? "Try changing your search terms." : "No users have been added yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
