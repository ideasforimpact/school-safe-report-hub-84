
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  icon: string;
  level: string;
  url: string | null;
  order: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateModuleDialogProps {
  module?: Module;
  isEdit?: boolean;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const CreateModuleDialog = ({ module, isEdit = false, onSuccess, trigger }: CreateModuleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    level: '',
    url: '',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (module && isEdit) {
      setFormData({
        name: module.name || '',
        icon: module.icon || '',
        level: module.level || '',
        url: module.url || '',
        active: module.active !== undefined ? module.active : true
      });
    } else {
      setFormData({
        name: '',
        icon: '',
        level: '',
        url: '',
        active: true
      });
    }
  }, [module, isEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit 
        ? `manage-modules?id=${module?.id}` 
        : 'manage-modules';

      const { data, error } = await supabase.functions.invoke(url, {
        body: formData,
        method
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Module ${isEdit ? 'updated' : 'created'} successfully`,
      });

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} module:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} module`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Module' : 'Create New Module'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the module information below.' : 'Fill in the details to create a new module.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter module name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              placeholder="Enter icon name (e.g., LayoutDashboard)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backoffice">Backoffice</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="Enter module URL"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleInputChange('active', checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Module' : 'Create Module')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateModuleDialog;
