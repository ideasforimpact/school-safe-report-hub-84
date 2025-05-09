import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import UserList from '@/components/users/UserList';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex gap-2">
            <Button 
              asChild
              variant="outline"
            >
              <Link to="/employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Go to Employee Management</span>
              </Link>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserList 
              onEditClick={(user) => {
                setCurrentUser(user);
                setIsEditDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
      />

      {/* Edit User Dialog */}
      {currentUser && (
        <EditUserDialog 
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          user={currentUser}
        />
      )}
    </Layout>
  );
};

export default UserManagement;
