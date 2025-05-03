import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose 
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ConfigurationManagement = () => {
  const { 
    categories, 
    addCategory, 
    deleteCategory, 
    updateCategory,
    subcategoryMappings, 
    addSubcategory, 
    deleteSubcategory, 
    updateSubcategory,
    locations,
    addLocation,
    deleteLocation,
    updateLocation,
    facilities,
    addFacility,
    deleteFacility,
    updateFacility,
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation
  } = useIncidents();
  
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryParent, setNewSubcategoryParent] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string, parentId: string} | null>(null);
  
  const [newLocation, setNewLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState<{id: string, name: string} | null>(null);
  
  const [newFacility, setNewFacility] = useState('');
  const [editingFacility, setEditingFacility] = useState<{id: string, name: string} | null>(null);
  
  const [newDesignation, setNewDesignation] = useState('');
  const [editingDesignation, setEditingDesignation] = useState<{id: string, name: string} | null>(null);

  // Category Management
  const handleCategoryAdd = () => {
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    addCategory(newCategory);
    setNewCategory('');
    toast.success("Category added successfully");
  };

  const handleCategoryDelete = (id: string) => {
    deleteCategory(id);
    toast.success("Category deleted successfully");
  };

  const handleCategoryUpdate = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    updateCategory(editingCategory.id, editingCategory.name);
    setEditingCategory(null);
    toast.success("Category updated successfully");
  };

  // Subcategory Management
  const handleSubcategoryAdd = () => {
    if (!newSubcategoryName.trim() || !newSubcategoryParent) {
      toast.error("Subcategory name and parent category are required");
      return;
    }
    
    addSubcategory(newSubcategoryParent, newSubcategoryName);
    setNewSubcategoryName('');
    setNewSubcategoryParent('');
    toast.success("Subcategory added successfully");
  };

  const handleSubcategoryDelete = (parentId: string, id: string) => {
    deleteSubcategory(parentId, id);
    toast.success("Subcategory deleted successfully");
  };

  const handleSubcategoryUpdate = () => {
    if (!editingSubcategory || !editingSubcategory.name.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    updateSubcategory(
      editingSubcategory.parentId, 
      editingSubcategory.id, 
      editingSubcategory.name
    );
    setEditingSubcategory(null);
    toast.success("Subcategory updated successfully");
  };

  // Location Management
  const handleLocationAdd = () => {
    if (!newLocation.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    addLocation(newLocation);
    setNewLocation('');
    toast.success("Location added successfully");
  };

  const handleLocationDelete = (id: string) => {
    deleteLocation(id);
    toast.success("Location deleted successfully");
  };

  const handleLocationUpdate = () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    updateLocation(editingLocation.id, editingLocation.name);
    setEditingLocation(null);
    toast.success("Location updated successfully");
  };

  // Facility Management
  const handleFacilityAdd = () => {
    if (!newFacility.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    addFacility(newFacility);
    setNewFacility('');
    toast.success("Facility added successfully");
  };

  const handleFacilityDelete = (id: string) => {
    deleteFacility(id);
    toast.success("Facility deleted successfully");
  };

  const handleFacilityUpdate = () => {
    if (!editingFacility || !editingFacility.name.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    updateFacility(editingFacility.id, editingFacility.name);
    setEditingFacility(null);
    toast.success("Facility updated successfully");
  };

  // Designation Management
  const handleDesignationAdd = () => {
    if (!newDesignation.trim()) {
      toast.error("Designation name cannot be empty");
      return;
    }
    
    addDesignation(newDesignation);
    setNewDesignation('');
    toast.success("Designation added successfully");
  };

  const handleDesignationDelete = (id: string) => {
    deleteDesignation(id);
    toast.success("Designation deleted successfully");
  };

  const handleDesignationUpdate = () => {
    if (!editingDesignation || !editingDesignation.name.trim()) {
      toast.error("Designation name cannot be empty");
      return;
    }
    
    updateDesignation(editingDesignation.id, editingDesignation.name);
    setEditingDesignation(null);
    toast.success("Designation updated successfully");
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Configuration Management</h1>
          <p className="text-gray-600 mt-1">
            Manage incident categories, subcategories, locations, facilities, and designations
          </p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
          </TabsList>
          
          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Incident Categories</CardTitle>
                <CardDescription>Manage available incident categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button onClick={handleCategoryAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingCategory({id: category.id, name: category.name})}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Category</DialogTitle>
                                  <DialogDescription>
                                    Update the category name below
                                  </DialogDescription>
                                </DialogHeader>
                                <Input
                                  placeholder="Category name"
                                  value={editingCategory?.name || ''}
                                  onChange={(e) => setEditingCategory(prev => prev ? {...prev, name: e.target.value} : null)}
                                  className="my-4"
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleCategoryUpdate}>Save Changes</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleCategoryDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Subcategories Tab */}
          <TabsContent value="subcategories">
            <Card>
              <CardHeader>
                <CardTitle>Subcategories</CardTitle>
                <CardDescription>Manage subcategories for each category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Parent Category</label>
                    <select
                      className="border border-input bg-background px-3 py-2 rounded-md"
                      value={newSubcategoryParent}
                      onChange={(e) => setNewSubcategoryParent(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">New Subcategory</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="New subcategory name"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                      />
                      <Button onClick={handleSubcategoryAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
                
                {categories.map((category) => (
                  <div key={category.id} className="mb-8">
                    <h3 className="text-lg font-medium mb-2">{category.name}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subcategory Name</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subcategoryMappings[category.id]?.map((subcategory) => (
                          <TableRow key={subcategory.id}>
                            <TableCell>{subcategory.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => setEditingSubcategory({
                                        id: subcategory.id,
                                        name: subcategory.name,
                                        parentId: category.id
                                      })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Subcategory</DialogTitle>
                                      <DialogDescription>
                                        Update the subcategory name below
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Input
                                      placeholder="Subcategory name"
                                      value={editingSubcategory?.name || ''}
                                      onChange={(e) => setEditingSubcategory(prev => prev ? {...prev, name: e.target.value} : null)}
                                      className="my-4"
                                    />
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline" onClick={() => setEditingSubcategory(null)}>Cancel</Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button onClick={handleSubcategoryUpdate}>Save Changes</Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleSubcategoryDelete(category.id, subcategory.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!subcategoryMappings[category.id] || subcategoryMappings[category.id].length === 0) && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              No subcategories found for this category
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Incident Locations</CardTitle>
                <CardDescription>Manage where incidents can happen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="New location name"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                  <Button onClick={handleLocationAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Location
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>{location.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingLocation({id: location.id, name: location.name})}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Location</DialogTitle>
                                  <DialogDescription>
                                    Update the location name below
                                  </DialogDescription>
                                </DialogHeader>
                                <Input
                                  placeholder="Location name"
                                  value={editingLocation?.name || ''}
                                  onChange={(e) => setEditingLocation(prev => prev ? {...prev, name: e.target.value} : null)}
                                  className="my-4"
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingLocation(null)}>Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleLocationUpdate}>Save Changes</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleLocationDelete(location.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Facilities Tab */}
          <TabsContent value="facilities">
            <Card>
              <CardHeader>
                <CardTitle>School Facilities</CardTitle>
                <CardDescription>Manage school facilities where incidents can occur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="New facility name"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                  />
                  <Button onClick={handleFacilityAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Facility
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facility Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell>{facility.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingFacility({id: facility.id, name: facility.name})}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Facility</DialogTitle>
                                  <DialogDescription>
                                    Update the facility name below
                                  </DialogDescription>
                                </DialogHeader>
                                <Input
                                  placeholder="Facility name"
                                  value={editingFacility?.name || ''}
                                  onChange={(e) => setEditingFacility(prev => prev ? {...prev, name: e.target.value} : null)}
                                  className="my-4"
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingFacility(null)}>Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleFacilityUpdate}>Save Changes</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleFacilityDelete(facility.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Designations Tab */}
          <TabsContent value="designations">
            <Card>
              <CardHeader>
                <CardTitle>User Designations</CardTitle>
                <CardDescription>Manage user role designations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="New designation name"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                  />
                  <Button onClick={handleDesignationAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Designation
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designation Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.map((designation) => (
                      <TableRow key={designation.id}>
                        <TableCell>{designation.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingDesignation({id: designation.id, name: designation.name})}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Designation</DialogTitle>
                                  <DialogDescription>
                                    Update the designation name below
                                  </DialogDescription>
                                </DialogHeader>
                                <Input
                                  placeholder="Designation name"
                                  value={editingDesignation?.name || ''}
                                  onChange={(e) => setEditingDesignation(prev => prev ? {...prev, name: e.target.value} : null)}
                                  className="my-4"
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" onClick={() => setEditingDesignation(null)}>Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleDesignationUpdate}>Save Changes</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDesignationDelete(designation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {designations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No designations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfigurationManagement;
