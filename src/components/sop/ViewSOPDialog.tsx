import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Layers, AlertCircle } from 'lucide-react';

interface SOPAssignment {
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

interface ViewSOPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sop: {
    id: string;
    title: string;
    description: string | null;
    category_name?: string | null;
    status: boolean;
    created_at: string;
    creator_name?: string | null;
    procedure_steps?: string[];
    important_notes?: string | null;
    assignments?: SOPAssignment[];
  } | null;
}

const ViewSOPDialog: React.FC<ViewSOPDialogProps> = ({ open, onOpenChange, sop }) => {
  if (!open || !sop) return null;

  const isActive = sop.status;
  const assignments = sop.assignments || [];

  const statusBadge = (
    <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const assignedGroupNames = assignments
    .map((a) => a.group_name)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SOP Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">SOP Information</TabsTrigger>
            <TabsTrigger value="steps">Procedure Steps</TabsTrigger>
            <TabsTrigger value="groups">Assigned Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="max-h-[65vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl break-all whitespace-normal">{sop.title}</CardTitle>
                      <div>{statusBadge}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category - Column wise */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                      <p className="text-sm font-medium text-gray-600">Category :</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {sop.category_name || '-'}
                      </p>
                    </div>

                    {/* Description - Full width, wrap nicely */}
                    {sop.description && (
                      <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        <p className="text-sm font-medium text-gray-600">Description :</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">
                          {sop.description}
                        </p>
                      </div>
                    )}

                    {/* Created By - Column wise */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                      <p className="text-sm font-medium text-gray-600">Created By :</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {sop.creator_name || '-'}
                      </p>
                    </div>

                    {/* Assigned to Groups - Badge design, wrap nicely */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                      <p className="text-sm font-medium text-gray-600">Assigned to Groups :</p>
                      <div className="flex flex-wrap gap-2 break-all whitespace-normal">
                        {assignedGroupNames.length > 0 ? (
                          assignedGroupNames.map((groupName, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-blue-50 border-blue-300 text-blue-700"
                            >
                              {groupName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notes - Card with orange border */}
                {sop.important_notes && (
                  <div className="rounded-lg border border-orange-300 bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <h3 className="text-sm font-semibold text-orange-600">Important Notes</h3>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">
                      {sop.important_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="mt-4">
            <div className="max-h-[65vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-black">Procedure Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  {sop.procedure_steps && sop.procedure_steps.length > 0 ? (
                    <div className="space-y-3 whitespace-pre-wrap break-all">
                      {sop.procedure_steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 flex-1 pt-1.5">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-4">No procedure steps available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <div className="max-h-[65vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {assignments.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">No groups assigned to this SOP.</div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <Card key={assignment.group_id || Math.random()}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base break-all whitespace-normal">
                            {assignment.group_name || 'Unnamed Group'}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {typeof assignment.employee_count === 'number' && assignment.employee_count > 0 && (
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
                        {/* Group Type - Column wise */}
                        {assignment.group_type && (
                          <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                            <p className="text-xs font-medium text-gray-500">Group Type :</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {assignment.group_type}
                            </p>
                          </div>
                        )}

                        {/* Created By - Column wise */}
                        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                          <p className="text-xs font-medium text-gray-500">Created By :</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-900">
                              {assignment.created_by_name || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Employees - Column wise with badge design */}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ViewSOPDialog;


