
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/auth";
import { useFacilities } from "@/contexts/FacilityContext";

const FacilityManagement = () => {
  const [newFacility, setNewFacility] = useState("");
  const { isAdmin } = useAuth();
  const { facilities, addFacility, resetFacilities } = useFacilities();
  const navigate = useNavigate();

  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      toast.error("You don't have permission to access this page");
    }
  }, [isAdmin, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFacility.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }

    // Check if facility already exists (case-insensitive)
    if (facilities.some(f => f.name.toLowerCase() === newFacility.trim().toLowerCase())) {
      toast.error("This facility already exists");
      return;
    }

    addFacility({ name: newFacility.trim() });
    setNewFacility("");
    toast.success("Facility added successfully");
  };

  const handleResetFacilities = () => {
    resetFacilities();
    toast.success("All facilities have been removed");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Facility Management</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Facilities</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all 
                  facilities from the system and reset your facilities list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetFacilities}>
                  Yes, delete all facilities
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Facility</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Facility Name
                  </label>
                  <Input
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    placeholder="Enter new facility name"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: Once added, facilities cannot be edited or deleted individually
                  </p>
                </div>
                
                <Button type="submit">
                  Add Facility
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {facilities.length === 0 ? (
                  <p className="text-muted-foreground italic">No facilities added yet</p>
                ) : (
                  <ul className="space-y-1">
                    {facilities.map((facility, index) => (
                      <li key={index} className="p-2 bg-gray-50 rounded-md">
                        {facility.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FacilityManagement;
