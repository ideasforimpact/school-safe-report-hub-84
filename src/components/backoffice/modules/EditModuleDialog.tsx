
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Module {
  id: string;
  name: string;
  icon: string;
  level: string;
}

interface EditModuleDialogProps {
  module: Module;
  onClose: () => void;
  onModuleUpdated: () => void;
}

const EditModuleDialog: React.FC<EditModuleDialogProps> = ({ module, onClose, onModuleUpdated }) => {
  const [formData, setFormData] = useState({
    name: module.name,
    icon: module.icon,
    level: module.level
  });
  const [submitting, setSubmitting] = useState(false);

  const iconOptions = [
    'LayoutDashboard', 'AlertTriangle', 'Users', 'ClipboardCheck', 
    'FileText', 'BarChart', 'Settings', 'Building2', 'MessageSquare', 
    'Car', 'FileCheck'
  ];

  const levelOptions = [
    { value: 'client', label: 'Client' },
    { value: 'backoffice', label: 'Backoffice' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.icon || !formData.level) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('modules')
        .update({
          name: formData.name.trim(),
          icon: formData.icon,
          level: formData.level,
          updated_at: new Date().toISOString()
        })
        .eq('id', module.id);

      if (error) {
        console.error('Error updating module:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update module"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Module updated successfully"
      });

      onModuleUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update module"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Module</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Module Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter module name"
              required
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Module'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditModuleDialog;
