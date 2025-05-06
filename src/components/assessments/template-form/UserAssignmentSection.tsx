
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/contexts/auth/types";

interface UserAssignmentSectionProps {
  users: User[];
  selectedUserIds: string[];
  setSelectedUserIds: (userIds: string[]) => void;
}

const UserAssignmentSection = ({
  users,
  selectedUserIds,
  setSelectedUserIds,
}: UserAssignmentSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.designation?.toLowerCase().includes(query)
    );
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(user => user.id));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="assign-users">Assign to Users (Optional)</Label>
        <Button 
          variant="link" 
          size="sm" 
          onClick={handleSelectAll}
          className="h-auto p-0"
        >
          {selectedUserIds.length === filteredUsers.length ? "Unselect All" : "Select All"}
        </Button>
      </div>
      
      <Input
        id="user-search"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-2"
      />
      
      <ScrollArea className="h-[150px] border rounded-md p-2">
        {filteredUsers.length > 0 ? (
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2 py-1">
                <Checkbox 
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="grid gap-0.5">
                  <Label 
                    htmlFor={`user-${user.id}`}
                    className="cursor-pointer"
                  >
                    {user.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                    {user.designation && ` • ${user.designation}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No users found
          </div>
        )}
      </ScrollArea>
      
      <div className="text-sm text-muted-foreground mt-1">
        {selectedUserIds.length} user(s) selected
      </div>
    </div>
  );
};

export default UserAssignmentSection;
