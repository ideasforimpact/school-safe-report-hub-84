import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import IPList, { IPAddress } from './IPList';
import { toast } from 'sonner';

interface IPWhitelistSectionProps {
  ips: IPAddress[];
  onAdd: (ip: IPAddress) => void;
  onRemove: (ip: string) => void;
  onUpdate?: (oldIp: string, newIp: IPAddress) => void;
}

/**
 * Validates IPv4 address format
 * @param ip - IP address to validate
 * @returns true if valid IPv4 format
 */
function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  // Check each octet is 0-255
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validates IPv6 address format (basic validation)
 * @param ip - IP address to validate
 * @returns true if valid IPv6 format
 */
function isValidIPv6(ip: string): boolean {
  // Basic IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

const IPWhitelistSection = ({ ips, onAdd, onRemove, onUpdate }: IPWhitelistSectionProps) => {
  const [newIP, setNewIP] = useState('');
  const [newIPName, setNewIPName] = useState('');
  const [editingIP, setEditingIP] = useState<IPAddress | null>(null);
  const [editIPValue, setEditIPValue] = useState('');
  const [editIPName, setEditIPName] = useState('');

  const validateIP = (ip: string): { valid: boolean; error?: string } => {
    if (!ip || ip.trim() === '') {
      return { valid: false, error: 'IP address is required' };
    }

    const trimmedIP = ip.trim();

    // Check if IP already exists
    if (ips.some(ipAddr => ipAddr.ip === trimmedIP)) {
      return { valid: false, error: 'This IP address is already added' };
    }

    // Validate IPv4
    if (isValidIPv4(trimmedIP)) {
      return { valid: true };
    }

    // Validate IPv6 (optional, for future support)
    if (isValidIPv6(trimmedIP)) {
      return { valid: true };
    }

    return { valid: false, error: 'Invalid IP address format. Use IPv4 (e.g., 192.168.1.1) or IPv6 format' };
  };

  const handleAdd = () => {
    const validation = validateIP(newIP);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid IP address');
      return;
    }

    const ipAddress: IPAddress = {
      ip: newIP.trim(),
      name: newIPName.trim() || undefined, // Keep as undefined here, will be normalized in useClientManagement
    };

    onAdd(ipAddress);
    setNewIP('');
    setNewIPName('');
    toast.success('IP address added successfully');
  };

  const handleEdit = (ipAddress: IPAddress) => {
    setEditingIP(ipAddress);
    setEditIPValue(ipAddress.ip);
    setEditIPName(ipAddress.name || '');
  };

  const handleUpdate = () => {
    if (!editingIP) return;

    const validation = validateIP(editIPValue);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid IP address');
      return;
    }

    // Check if new IP conflicts with existing IPs (excluding the one being edited)
    if (ips.some(ipAddr => ipAddr.ip === editIPValue.trim() && ipAddr.ip !== editingIP.ip)) {
      toast.error('This IP address is already added');
      return;
    }

    if (onUpdate) {
      onUpdate(editingIP.ip, {
        ip: editIPValue.trim(),
        name: editIPName.trim() || undefined, // Keep as undefined here, will be normalized in useClientManagement
      });
      toast.success('IP address updated successfully');
    }

    setEditingIP(null);
    setEditIPValue('');
    setEditIPName('');
  };

  const handleCancelEdit = () => {
    setEditingIP(null);
    setEditIPValue('');
    setEditIPName('');
  };

  return (
    <div className="space-y-2 border-t pt-4 mt-4">
      <label className="font-medium">IP Whitelist</label>
      <p className="text-sm text-gray-500">
        Only users from these IP addresses can access this client's portal. 
        Add the school's public IP addresses.
      </p>
      
      {editingIP ? (
        // Edit mode
        <div className="space-y-2 p-3 border rounded-md bg-blue-50">
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. 203.0.113.1" 
              value={editIPValue}
              onChange={(e) => setEditIPValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUpdate();
                }
              }}
              className="font-mono"
            />
            <Input 
              placeholder="Name (optional)" 
              value={editIPName}
              onChange={(e) => setEditIPName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUpdate();
                }
              }}
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleUpdate} size="sm" variant="default">
              Save
            </Button>
            <Button type="button" onClick={handleCancelEdit} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // Add mode
        <div className="flex gap-2 mb-2">
          <Input 
            placeholder="e.g. 203.0.113.1" 
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="font-mono"
          />
          <Input 
            placeholder="Name (optional)" 
            value={newIPName}
            onChange={(e) => setNewIPName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="w-40"
          />
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      )}

      <IPList ips={ips} onRemove={onRemove} onEdit={handleEdit} />
    </div>
  );
};

export default IPWhitelistSection;


