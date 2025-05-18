
import { useState } from "react";
import { PlusCircle, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import UserList from "@/components/users/UserList";
import AddUserDialog from "@/components/users/AddUserDialog";
import EditUserDialog from "@/components/users/EditUserDialog";
import { Input } from "@/components/ui/input";

const UserManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const isSuperAdmin = user?.modulePermissions?.superAdmin;

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage users and their permissions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          
          <div className="flex gap-2">
            {isSuperAdmin && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => alert("Import functionality coming soon!")}
                  className="whitespace-nowrap"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Users
                </Button>
                
                <Button onClick={() => setIsAddDialogOpen(true)} className="whitespace-nowrap">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <UserList 
        searchQuery={searchQuery} 
        onEditUser={handleEditUser} 
      />

      <AddUserDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
      
      {selectedUser && (
        <EditUserDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
