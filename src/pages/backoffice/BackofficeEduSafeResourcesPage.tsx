import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, FileText, Download, Edit, Trash, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { toast } from 'sonner';

interface BackofficeEduSafeResource {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  document_url: string;
  client_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

const BackofficeEduSafeResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClient();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [resources, setResources] = useState<BackofficeEduSafeResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<BackofficeEduSafeResource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'procedures',
    tags: [] as string[],
    file: null as File | null
  });
  const [newTag, setNewTag] = useState('');

  const categories = ['posters', 'procedures', 'guidelines', 'forms', 'other'];

  useEffect(() => {
    if (selectedClientId) {
      fetchResources();
    }
  }, [selectedClientId]);

  const fetchResources = async () => {
    if (!selectedClientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: { 
          action: 'list',
          client_id: selectedClientId 
        }
      });

      if (error) throw error;
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddResource = async () => {
    if (!selectedClientId || !formData.file) {
      toast.error('Please select a client and file');
      return;
    }

    setUploadLoading(true);
    try {
      const base64 = await fileToBase64(formData.file);
      
      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: {
          action: 'create',
          client_id: selectedClientId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          document_url: base64
        }
      });

      if (error) throw error;
      
      toast.success('Resource uploaded successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to upload resource');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditResource = async () => {
    if (!currentResource) return;

    setUpdateLoading(true);
    try {
      let document_url = currentResource.document_url;
      
      if (formData.file) {
        document_url = await fileToBase64(formData.file);
      }

      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: {
          action: 'update',
          id: currentResource.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          document_url
        }
      });

      if (error) throw error;
      
      toast.success('Resource updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: {
          action: 'delete',
          id
        }
      });

      if (error) throw error;
      
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'procedures',
      tags: [],
      file: null
    });
    setNewTag('');
    setCurrentResource(null);
  };

  const openEditDialog = (resource: BackofficeEduSafeResource) => {
    setCurrentResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      tags: [...resource.tags],
      file: null
    });
    setIsEditDialogOpen(true);
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/backoffice/dashboard')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">EduSafe Resources Management</h1>
        </div>
      </div>

      {/* Client Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
          <CardDescription>Choose a client to manage their EduSafe resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-md">
            <Label htmlFor="client-select">Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClientId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Manage EduSafe resources for the selected client</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Resources Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading resources...
                      </TableCell>
                    </TableRow>
                  ) : filteredResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No resources match your search' : 'No resources found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">{resource.title}</div>
                              <div className="text-sm text-gray-500">{resource.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(resource.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(resource)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Resource
            </DialogTitle>
            <DialogDescription>
              Add a new EduSafe resource for the selected client
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter resource title"
                required
                disabled={uploadLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a brief description of this resource"
                rows={3}
                disabled={uploadLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={uploadLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag and press Enter"
                    className="flex-1"
                    disabled={uploadLoading}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddTag} 
                    disabled={!newTag.trim() || uploadLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={uploadLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload File *</Label>
              {formData.file ? (
                <div className="border rounded-md p-4 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2 rounded-md">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormData({ ...formData, file: null })}
                    disabled={uploadLoading}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload</p>
                  <p className="text-xs text-gray-500 mb-4">PDF, DOCX, or Images up to 10MB</p>
                  <input
                    id="file"
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={uploadLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file')?.click()}
                    disabled={uploadLoading}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={uploadLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddResource} 
              disabled={!formData.title || !formData.file || uploadLoading}
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Resource
            </DialogTitle>
            <DialogDescription>
              Update the resource information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter resource title"
                required
                disabled={updateLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a brief description of this resource"
                rows={3}
                disabled={updateLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={updateLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="edit-tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag and press Enter"
                    className="flex-1"
                    disabled={updateLoading}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddTag} 
                    disabled={!newTag.trim() || updateLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={updateLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-file">Replace File (Optional)</Label>
              {formData.file ? (
                <div className="border rounded-md p-4 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2 rounded-md">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormData({ ...formData, file: null })}
                    disabled={updateLoading}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload new file</p>
                  <p className="text-xs text-gray-500 mb-4">PDF, DOCX, or Images up to 10MB</p>
                  <input
                    id="edit-file"
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={updateLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-file')?.click()}
                    disabled={updateLoading}
                  >
                    Select File
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Leave empty to keep the current file
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditResource}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Resource
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackofficeEduSafeResourcesPage;
