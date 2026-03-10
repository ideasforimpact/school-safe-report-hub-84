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
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { EDUSAFE_DESCRIPTION_MAX_LENGTH, EDUSAFE_TAG_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/constants';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface BackofficeEduSafeResource {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  document_url: string;
  client_type_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface ClientType {
  id: string;
  name: string;
  key: string;
  created_at: string;
  updated_at: string;
}

const BackofficeEduSafeResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
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
    category: 'policy',
    tags: [] as string[],
    file: null as File | null,
    client_type_id: ''
  });
  const [newTag, setNewTag] = useState('');
  const [titleError, setTitleError] = useState('');
  const [tagError, setTagError] = useState('');

  const categories = ['posters', 'policy', 'guidelines', 'forms', 'other'];

  // Function to validate title - only allow letters, numbers, spaces, and basic punctuation
  const validateTitle = (value: string) => {
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validTitleRegex = /^[a-zA-Z0-9][a-zA-Z0-9\s\-'()]*$/;
    if (!validTitleRegex.test(value)) {
      return 'Title can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    
    return '';
  };

  // Function to validate tags - only allow letters, numbers, spaces, and basic punctuation
  const validateTag = (value: string) => {
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validTagRegex = /^[a-zA-Z0-9\s\-'()]+$/;
    
    if (!validTagRegex.test(value)) {
      return 'Tags can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    
    return '';
  };

  useEffect(() => {
    fetchClientTypes();
    fetchAllResources();
  }, []);

  const fetchClientTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('client_type')
        .select('*')
        .order('name');

      if (error) throw error;
      setClientTypes(data || []);
    } catch (error) {
      console.error('Error fetching client types:', error);
      toast.error('Failed to fetch client types');
    }
  };

  const fetchAllResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: { 
          action: 'list_all'
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
      // Validate the tag before adding
      const error = validateTag(newTag.trim());
      if (error) {
        setTagError(error);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
      setTagError(''); // Clear any previous errors
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
    if (!formData.client_type_id || !formData.file) {
      toast.error('Please select a client type and file');
      return;
    }

    setUploadLoading(true);
    try {
      const base64 = await fileToBase64(formData.file);
      
      const { data, error } = await supabase.functions.invoke('backoffice-edusafe-resource', {
        body: {
          action: 'create',
          client_type_id: formData.client_type_id,
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
      fetchAllResources();
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
          client_type_id: formData.client_type_id,
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
      fetchAllResources();
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
      fetchAllResources();
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
      category: 'policy',
      tags: [],
      file: null,
      client_type_id: ''
    });
    setNewTag('');
    setCurrentResource(null);
    setTitleError('');
    setTagError('');
  };

  const openEditDialog = (resource: BackofficeEduSafeResource) => {
    setCurrentResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      tags: [...resource.tags],
      file: null,
      client_type_id: resource.client_type_id
    });
    setIsEditDialogOpen(true);
  };

  const handleViewResource = (resource: BackofficeEduSafeResource) => {
    if (!resource.document_url) {
      toast.error('No document available to view');
      return;
    }
    
    try {
      const documentUrl = resource.document_url;
      let urlToOpen: string;

      // Check if it's a relative storage path (starts with edusafe-resources/ or /edusafe-resources/)
      if (documentUrl.startsWith('edusafe-resources/') || documentUrl.startsWith('/edusafe-resources/')) {
        // Prepend the Supabase storage base URL
        const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL;
        const normalizedBase = base.replace(/\/$/, '');
        const normalizedPath = documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`;
        urlToOpen = `${normalizedBase}${normalizedPath}`;
      } else {
        // It's already a full URL, use it directly
        urlToOpen = documentUrl;
      }

      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('[BackofficeEduSafeResourcesPage] Error opening document:', error);
      toast.error('Failed to open document');
    }
  };

  const handleDownloadResource = async (resource: BackofficeEduSafeResource) => {
    if (!resource.document_url) {
      toast.error('No document available to download');
      return;
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = resource.document_url;
      
      // Extract filename from URL or use resource title
      const urlParts = resource.document_url.split('/');
      const filename = urlParts[urlParts.length - 1] || `${resource.title}.pdf`;
      
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Failed to download resource');
    }
  };

  const getClientTypeName = (clientTypeId: string) => {
    const clientType = clientTypes.find(ct => ct.id === clientTypeId);
    return clientType ? clientType.name : 'Unknown';
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

useRealTimeSubHook({
  channelName: 'backoffice-edusafe-resource',
  table: 'backoffice_edusafe_resource',
  events: '*',
  enabled: true,
  onPayload: (payload) => {
    const { eventType, old } = payload;
    if (
      eventType === 'DELETE' &&
      currentResource &&
      old?.id === currentResource.id
    ) {
      setIsEditDialogOpen(false);
      resetForm();
      setCurrentResource(null);
    }


    fetchAllResources();
  },
});


  return (
    <Layout>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">EduSafe Resources Management</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Resources</CardTitle>
                <CardDescription>Manage EduSafe resources for all client types</CardDescription>
              </div>
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
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
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px] max-w-[400px]">Title</TableHead>
                    <TableHead>Client Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading resources...
                      </TableCell>
                    </TableRow>
                  ) : filteredResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No resources match your search' : 'No resources found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="min-w-[300px] max-w-[400px]">
                          <div className="flex items-start">
                            <FileText className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium break-words">{resource.title}</div>
                              {resource.description && (
                                <div className="text-sm text-gray-500 break-words mt-1">{resource.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getClientTypeName(resource.client_type_id)}
                          </Badge>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewResource(resource)}
                              title="View document"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadResource(resource)}
                              title="Download document"
                            >
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

        {/* Upload Resource Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Resource
              </DialogTitle>
              <DialogDescription>
                Add a new EduSafe resource for a specific client type
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="client-type">Client Type <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.client_type_id} 
                  onValueChange={(value) => setFormData({ ...formData, client_type_id: value })}
                  disabled={uploadLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map((clientType) => (
                      <SelectItem key={clientType.id} value={clientType.id}>
                        {clientType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.startsWith(' ')) return;
                    setFormData({ ...formData, title: value });
                    setTitleError(validateTitle(value));
                  }}
                  placeholder="Enter resource title"
                  required
                  maxLength={TITLE_MAX_LENGTH}
                  disabled={uploadLoading}
                />
                <div className="text-xs text-gray-500 text-right">
                  {formData.title.length}/{TITLE_MAX_LENGTH} characters
                </div>
                {titleError && (
                  <p className="text-xs text-red-500 mt-1">{titleError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <TextareaWithVoice
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.startsWith(' ')) return;
                    setFormData({ ...formData, description: value });
                  }}
                  placeholder="Provide a brief description of this resource"
                  rows={3}
                  disabled={uploadLoading}
                  maxLength={EDUSAFE_DESCRIPTION_MAX_LENGTH}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                {formData.description.length}/{EDUSAFE_DESCRIPTION_MAX_LENGTH} characters
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
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
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.startsWith(' ')) return;
                        setNewTag(value);
                        setTagError(validateTag(value));
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag and press Enter"
                      className="flex-1"
                      disabled={uploadLoading}
                      maxLength={EDUSAFE_TAG_MAX_LENGTH}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddTag} 
                      disabled={!newTag.trim() || uploadLoading || !!tagError}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {newTag.length}/{EDUSAFE_TAG_MAX_LENGTH} characters
                  </div>
                  
                  {tagError && (
                    <p className="text-xs text-red-500 mt-1">{tagError}</p>
                  )}
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                          <span className="text-sm">{tag}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={uploadLoading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">File <span className="text-red-500">*</span></Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                  disabled={uploadLoading}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }} disabled={uploadLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddResource} 
                disabled={!formData.title || !formData.file || !formData.client_type_id || uploadLoading || !!titleError || !!tagError}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Resource'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Resource Dialog */}
      {isEditDialogOpen && currentResource && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 break-words">
                <Edit className="h-5 w-5 flex-shrink-0" />
                <span className="break-words">{currentResource?.title || 'Edit Resource'}</span>
              </DialogTitle>
              <DialogDescription>
                Update the EduSafe resource details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-type">Client Type <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.client_type_id} 
                  onValueChange={(value) => setFormData({ ...formData, client_type_id: value })}
                  disabled={updateLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map((clientType) => (
                      <SelectItem key={clientType.id} value={clientType.id}>
                        {clientType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith(' ')) return;
                    setFormData({ ...formData, title: value });
                    setTitleError(validateTitle(value));
                  }}
                  placeholder="Enter resource title"
                  required
                  maxLength={TITLE_MAX_LENGTH}
                  disabled={updateLoading}
                />
                <div className="text-xs text-gray-500 text-right">
                  {formData.title.length}/{TITLE_MAX_LENGTH} characters
                </div>
                {titleError && (
                  <p className="text-xs text-red-500 mt-1">{titleError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <TextareaWithVoice
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.startsWith(' ')) return;
                    setFormData({ ...formData, description: value });
                  }}
                  placeholder="Provide a brief description of this resource"
                  rows={3}
                  disabled={updateLoading}
                  maxLength={EDUSAFE_DESCRIPTION_MAX_LENGTH}
                />
              </div>
                <div className="text-xs text-gray-500 text-right">
                  {formData.description.length}/{EDUSAFE_DESCRIPTION_MAX_LENGTH} characters
                </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category <span className="text-red-500">*</span></Label>
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
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.startsWith(' ')) return;
                        setNewTag(value);
                        setTagError(validateTag(value));
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag and press Enter"
                      className="flex-1"
                      disabled={updateLoading}
                      maxLength={EDUSAFE_TAG_MAX_LENGTH}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddTag} 
                      disabled={!newTag.trim() || updateLoading || !!tagError}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {newTag.length}/{EDUSAFE_TAG_MAX_LENGTH} characters
                  </div>
                  
                  {tagError && (
                    <p className="text-xs text-red-500 mt-1">{tagError}</p>
                  )}
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                          <span className="text-sm">{tag}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={updateLoading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-file">File (optional - leave empty to keep current file)</Label>
                
                {/* Show current file information */}
                {currentResource?.document_url && (
                  <div className="border rounded-md p-3 bg-gray-50 mb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 100px)' }}>
                        <div className="bg-blue-50 p-2 rounded-md flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                          <p className="font-medium text-sm mb-1">Current File</p>
                          <p className="text-xs text-gray-500" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                            {currentResource.document_url.split('/').pop() || 'Document'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewResource(currentResource)}
                          title="View current file"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadResource(currentResource)}
                          title="Download current file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <Input
                  id="edit-file"
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={updateLoading}
                />
                <p className="text-xs text-gray-500">
                  Select a new file to replace the current one, or leave empty to keep the existing file.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }} disabled={updateLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditResource} 
                disabled={!formData.title || !formData.client_type_id || updateLoading || !!titleError || !!tagError}
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Resource'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </Layout>
  );
};

export default BackofficeEduSafeResourcesPage;
