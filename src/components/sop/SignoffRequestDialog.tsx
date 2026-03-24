import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Clock3,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {formatDate} from '@/lib/Dateformat';  
import Loader from '../common/Loader';

interface SOPAssignment {
  group_id: string | null;
  group_name: string | null;
}

interface SignoffRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sop: {
    id: string;
    title: string;
    description?: string | null;
    status?: boolean;
    procedure_steps?: string[];
    important_notes?: string | null;
    assignments?: SOPAssignment[];
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
  const [understoodSteps, setUnderstoodSteps] = useState<boolean[]>([]);

  const isActive = sop?.status ?? false;
  const procedureSteps = sop?.procedure_steps || [];
  const assignments = sop?.assignments || [];
  const isSignedOff =sopSignoffRequestExist || sop?.sop_signoff_request_exist;

  useEffect(() => {
    if (!sop?.procedure_steps?.length) {
      setUnderstoodSteps([]);
      return;
    }

    setUnderstoodSteps(sop.procedure_steps.map(() => false));
  }, [sop?.procedure_steps]);


  const signoffStatus =
    sopSignoffRequestExist || sop?.sop_signoff_request_exist
      ? 'Signed Off'
      : 'In-progress';

  const groupIds = assignments
    .map((a) => a.group_id)
    .filter((id): id is string => Boolean(id));


  const handleDownloadPDF = () => {
    toast.info('PDF download functionality coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignoffRequest = async () => {
    if (!clientId || !employeeId || !sop?.id || groupIds.length === 0) {
      toast.error('Missing required information for signoff request');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.functions.invoke(
        'sop-signoff-request',
        {
          body: {
            sop_id: sop.id,
            client_id: clientId,
            employee_id: employeeId,
            group_ids: groupIds,
          },
        }
      );

      if (error) throw error;

      toast.success('Signoff request submitted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit signoff request');
    } finally {
      setSubmitting(false);
    }
  };
  const allStepsUnderstood =
    procedureSteps.length > 0 &&
    understoodSteps.length === procedureSteps.length &&
    understoodSteps.every(Boolean);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogOverlay className="bg-black/40" />

      <AlertDialogContent className="max-w-4xl p-0 bg-white rounded-lg overflow-hidden">

        {!sop ? (
          <Loader text="Loading SOP..." />
        ) : (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <h2 className="text-lg font-semibold break-all whitespace-normal">{sop.title}</h2>

                <Badge
                  className={
                    isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-3 ">
              <Badge
                  className={
                    signoffStatus === 'Signed Off'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  }
                >
                  {signoffStatus}
                </Badge>
                {sop.completed_date && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock3 className="h-4 w-4 flex-shrink-0" />
                    Signed off on {formatDate(sop.completed_date, { isTiming: true })}
                  </span>
                )}

                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">

              {/* OVERVIEW */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Overview</h3>
                <p className="text-sm text-gray-700 break-all whitespace-normal">
                  {sop.description || '-'}
                </p>
              </div>

              {/* PROCEDURE STEPS */}
              <div className="p-2">
                <h3 className="text-sm font-semibold mb-4">Procedure Steps</h3>

                <div className="space-y-3 break-all whitespace-normal">
                  {procedureSteps.map((step, index) => {
                    const isUnderstood = isSignedOff || understoodSteps[index];


                    return (
                      <div
                        key={index}
                        className={`flex items-start justify-between gap-4 p-4 rounded-lg border bg-white
                        border-l-[6px] transition-colors duration-200
                        ${isUnderstood
                            ? 'border-l-green-500 border-gray-200'
                            : 'border-l-gray-300 border-gray-200'
                          }`}
                      >

                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border
                                ${isUnderstood
                                ? 'bg-green-600 border-green-600'
                                : 'bg-gray-100 border-gray-300'
                              }`}
                          >
                            <Check
                              className={`h-4 w-4 ${isUnderstood ? 'text-white' : 'text-gray-400'
                                }`}
                            />
                          </div>

                          <p className="text-sm text-gray-700 pt-1">
                            {step}
                          </p>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isUnderstood || isSignedOff}

                          onClick={() =>
                            setUnderstoodSteps((prev) => {
                              const updated = [...prev];
                              updated[index] = true;
                              return updated;
                            })
                          }
                          title={isUnderstood ? 'Understood' : 'Mark as understood'}
                          className={`h-8 w-8 transition-colors
                            ${isUnderstood
                              ? 'text-green-600 cursor-default'
                              : 'text-gray-400 hover:text-green-600'
                            }`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>

                      </div>
                    );
                  })}
                </div>
              </div>
              {sop.important_notes && (
                <div className="border border-orange-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm font-semibold text-orange-600">
                      Important Notes
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 break-all whitespace-normal">
                    {sop.important_notes}
                  </p>
                </div>
              )}
            </div>

          <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 text-white"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              <Button variant="outline" onClick={handlePrint}>
                Print
              </Button>

              {!sopSignoffRequestExist &&
                !sop.sop_signoff_request_exist && (
                  <Button
                    variant="outline"
                    disabled={
                      submitting ||
                      groupIds.length === 0 ||
                      !allStepsUnderstood
                    }
                    onClick={handleSignoffRequest}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Sign Off
                      </>
                    )}
                  </Button>
                )}
            </div>
          </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SignoffRequestDialog;
