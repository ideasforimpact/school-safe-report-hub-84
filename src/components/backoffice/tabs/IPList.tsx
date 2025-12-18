import React from 'react';
import { Badge } from "@/components/ui/badge";
import { X, Edit2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export interface IPAddress {
  ip: string;
  name?: string;
}

interface IPListProps {
  ips: IPAddress[];
  onRemove: (ip: string) => void;
  onEdit?: (ip: IPAddress) => void;
}

const IPList = ({ ips, onRemove, onEdit }: IPListProps) => {
  return (
    <div className="space-y-2 mt-2">
      {ips.map((ipAddress) => (
        <div 
          key={ipAddress.ip} 
          className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {ipAddress.ip}
            </Badge>
            {ipAddress.name && (
              <span className="text-sm text-gray-600">({ipAddress.name})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(ipAddress)}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
                <span className="sr-only">Edit {ipAddress.ip}</span>
              </Button>
            )}
            <button 
              onClick={() => onRemove(ipAddress.ip)} 
              className="ml-1 hover:text-destructive focus:outline-none"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {ipAddress.ip}</span>
            </button>
          </div>
        </div>
      ))}
      {ips.length === 0 && (
        <p className="text-sm text-gray-500 italic">No IP addresses added yet</p>
      )}
    </div>
  );
};

export default IPList;


