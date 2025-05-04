
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ClientStatusBadgeProps {
  active: boolean;
}

const ClientStatusBadge = ({ active }: ClientStatusBadgeProps) => {
  return (
    <Badge 
      variant={active ? "secondary" : "destructive"} 
      className={active ? "bg-green-100 text-green-800" : ""}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
};

export default ClientStatusBadge;
