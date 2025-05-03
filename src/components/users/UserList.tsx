
import React from 'react';
import { User, UserRole, ModulePermissions } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface UserListProps {
  users: User[];
  onEditClick: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserList = ({ users, onEditClick, onDeleteUser }: UserListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Module Permissions</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                user.role === 'admin' || user.role === 'saas_owner' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'saas_owner' ? 'SaaS Owner' : 'Reporter'}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.modulePermissions?.incidentReporting && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Reporting</span>
                )}
                {user.modulePermissions?.allIncidents && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">All Incidents</span>
                )}
                {user.modulePermissions?.insights && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">Insights</span>
                )}
                {user.modulePermissions?.benchmarking && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">Benchmarking</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEditClick(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDeleteUser(user.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserList;
