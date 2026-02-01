import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';

interface GroupAssignment {
  group_id: string | null;
  group_name: string | null;
  group_type: string | null;
  group_status: boolean | null;
  employee_count?: number | null;
  employees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  }> | null;
  created_by_id: string | null;
  created_by_name: string | null;
}

interface GroupDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GroupAssignment[];
  sopTitle?: string;
  isSuperAdmin?: boolean;
}

const GroupDetailsDialog: React.FC<GroupDetailsDialogProps> = ({
  open,
  onOpenChange,
  groups,
  sopTitle,
  isSuperAdmin = false,
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Groups -
            {sopTitle && (
              <span className="text-sm font-normal text-gray-500  break-all whitespace-normal">
                 {sopTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {groups.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 text-center">
              No groups assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((assignment) => (
                <Card key={assignment.group_id || Math.random()}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base  break-all whitespace-normal">
                        {assignment.group_name || 'Unnamed Group'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {isSuperAdmin && typeof assignment.employee_count === 'number' && assignment.employee_count > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 border-orange-300 text-orange-700"
                          >
                            {assignment.employee_count} employee
                            {assignment.employee_count === 1 ? '' : 's'}
                          </Badge>
                        )}
                        <Badge
                          className={
                            assignment.group_status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {assignment.group_status ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignment.group_type && (
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                        <p className="text-xs font-medium text-gray-500">Group Type :</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {assignment.group_type}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                      <p className="text-xs font-medium text-gray-500">Created By :</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-900">
                          {assignment.created_by_name || '-'}
                        </p>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        <p className="text-xs font-medium text-gray-500">Employees</p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.employees && assignment.employees.length > 0 ? (
                            assignment.employees.map((emp) => (
                              <Badge
                                key={emp.id}
                                variant="outline"
                                className="bg-blue-50 border-blue-300 text-blue-700"
                              >
                                {emp.full_name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDetailsDialog;

