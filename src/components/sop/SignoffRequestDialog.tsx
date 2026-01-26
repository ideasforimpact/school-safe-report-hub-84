import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, User, AlertCircle, CheckCircle2, Download, Printer, Clock3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface SignoffRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sop: {
    id: string;
    title: string;
    description?: string | null;
    category_name?: string | null;
    status?: boolean;
    creator_name?: string | null;
    procedure_steps?: string[];
    important_notes?: string | null;
    assignments?: SOPAssignment[];
    signoff_request_status?: string;
    sop_signoff_request_exist?: boolean;
    completed_date?: string | null;
  } | null;
  clientId: string | null;
  employeeId: string | null;
  sopSignoffRequestExist?: boolean;
  onSuccess?: () => void;
}

const SignoffRequestDialog: React.FC<SignoffRequestDialogProps> = ({
  open,
  onOpenChange,
  sop,
  clientId,
  employeeId,
  sopSignoffRequestExist = false,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!open || !sop) return null;

  const isActive = sop.status ?? false;
  const assignments = sop.assignments || [];
  const procedureSteps = sop.procedure_steps || [];

  // Determine signoff status
  const signoffStatus = sopSignoffRequestExist || sop.sop_signoff_request_exist
    ? 'Signed Off'
    : 'In-progress';

  const statusBadge = (
    <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const signoffStatusBadge = (
    <Badge
      className={
        signoffStatus === 'Signed Off'
          ? 'bg-green-100 text-green-800'
          : 'bg-amber-100 text-amber-800'
      }
    >
      {signoffStatus}
    </Badge>
  );

  const assignedGroupNames = assignments
    .map((a) => a.group_name)
    .filter(Boolean);

  const groupIds = assignments
    .map((a) => a.group_id)
    .filter((id): id is string => Boolean(id));

  // Format date in 12-hour format with AM/PM
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = hours.toString().padStart(2, '0');
      
      return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    toast.info('PDF download functionality coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignoffRequest = async () => {
    if (!clientId || !employeeId || !sop.id || groupIds.length === 0) {
      toast.error('Missing required information for signoff request');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('sop-signoff-request', {
        body: {
          sop_id: sop.id,
          client_id: clientId,
          employee_id: employeeId,
          group_ids: groupIds,
        },
      });

      if (error) {
        console.error('Error submitting signoff request:', error);
        const message = (error as any)?.message || 'Failed to submit signoff request';
        toast.error(message);
        return;
      }

      if (data?.error) {
        const detail = data.details ? `: ${data.details}` : '';
        toast.error(`${data.error}${detail}`);
        return;
      }

      toast.success('Signoff request submitted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting signoff request:', error);
      const message = error?.message || 'Failed to submit signoff request';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Signoff Request
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
                      <CardTitle className="text-xl">{sop.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {statusBadge}
                        {signoffStatusBadge}
                      </div>
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
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
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
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
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
                        {sop.completed_date && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>Signed off on {formatDate(sop.completed_date)}</span>
                          </div>
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
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
                  {procedureSteps.length > 0 ? (
                    <div className="space-y-3">
                      {procedureSteps.map((step, index) => (
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
                          <CardTitle className="text-base">
                            {assignment.group_name || 'Unnamed Group'}
                          </CardTitle>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t flex justify-end gap-2">
          <Button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          >
            Print
          </Button>
          {!sopSignoffRequestExist && !sop.sop_signoff_request_exist && (
            <Button
              onClick={handleSignoffRequest}
              disabled={submitting || groupIds.length === 0}
              variant="outline"
              className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sign Off
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignoffRequestDialog;
