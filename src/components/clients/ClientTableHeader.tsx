
import React from 'react';
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';

const ClientTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Logo</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Contact Person</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Created On</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Module Access</TableHead>
        <TableHead className="w-[100px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClientTableHeader;
