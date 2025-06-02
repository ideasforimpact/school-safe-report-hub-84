
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClientTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12"></TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Institution Type</TableHead>
        <TableHead>Contact Person</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Super Admin Email</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
