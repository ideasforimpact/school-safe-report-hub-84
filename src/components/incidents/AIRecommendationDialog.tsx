import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';

type AIRecommendationDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentJson: any | null; // raw payload object
  incidentId?: string; // incident ID to save the recommendation
};

type AiResult = {
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediate_actions: string[];
  corrective_actions: { action: string; owner_role: string; due_days: number; evidence_required: string[] }[];
  preventive_actions: string[];
  policy_refs: string[];
};

export const AIRecommendationDialog: React.FC<AIRecommendationDialogProps> = ({ open, onOpenChange, incidentJson, incidentId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AiResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<'immediate' | 'corrective' | 'preventive' | 'policy'>('immediate');
  const { toast } = useToast();
  const { getClientId, getEmployeeId } = useEmployeeAccess();

  const callEdgeFunction = React.useCallback(async () => {
    if (!incidentJson) return;
    
    const clientId = getClientId();
    const employeeId = getEmployeeId();
    
    if (!clientId || !employeeId) {
      setError('Client ID or Employee ID not available. Please ensure you are logged in.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call the edge function
      const { data, error: edgeError } = await supabase.functions.invoke('prepare-recommended-action', {
        body: {
          incidentJson,
          client_id: clientId,
          employee_id: employeeId,
        },
      });

      if (edgeError) {
        throw new Error(edgeError.message || 'Failed to call recommendation service');
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'Failed to generate recommendations');
      }

      const parsed = data.data as AiResult;
      setResult(parsed);

      // Save to database if incidentId is provided
      if (incidentId) {
        try {
          const { error: updateError } = await (supabase as any)
            .from('incidents')
            .update({ recommended_action: parsed })
            .eq('id', incidentId);

          if (updateError) {
            console.error('Failed to save recommendation to database:', updateError);
            // Don't throw - we still want to show the result even if save fails
            toast({
              title: 'Warning',
              description: 'Recommendation generated but failed to save. Please try refreshing.',
              variant: 'destructive',
            });
          }
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
          // Don't throw - we still want to show the result
        }
      }
    } catch (e: any) {
      console.error('Error calling edge function:', e);
      setError(e?.message || 'Failed to generate AI recommendation');
    } finally {
      setIsLoading(false);
    }
  }, [incidentJson, incidentId, toast, getClientId, getEmployeeId]);

  React.useEffect(() => {
    if (open && incidentJson) {
      callEdgeFunction();
    } else if (!open) {
      setIsLoading(false);
      setError(null);
      setResult(null);
    }
  }, [open, incidentJson, callEdgeFunction]);

  const handleRefresh = () => {
    if (incidentJson) {
      callEdgeFunction();
    }
  };

  const renderImmediateActions = () => {
    if (!result?.immediate_actions || result.immediate_actions.length === 0) {
      return <p className="text-sm text-gray-500">No immediate actions available.</p>;
    }

    return (
      <div className="space-y-4">
        {result.immediate_actions.map((action, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{idx + 1}</span>
            </div>
            <p className="flex-1 text-sm text-gray-700">{action}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderCorrectiveActions = () => {
    if (!result?.corrective_actions || result.corrective_actions.length === 0) {
      return <p className="text-sm text-gray-500">No corrective actions available.</p>;
    }

    return (
      <div className="space-y-4">
        {result.corrective_actions.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{idx + 1}</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-gray-700">{item.action}</p>
              {item.owner_role && (
                <p className="text-xs text-gray-500">
                  Owner: {item.owner_role} {item.due_days ? `• Due in ${item.due_days} days` : ''}
                </p>
              )}
              {item.evidence_required && item.evidence_required.length > 0 && (
                <p className="text-xs text-gray-500">
                  Evidence: {item.evidence_required.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPreventiveActions = () => {
    if (!result?.preventive_actions || result.preventive_actions.length === 0) {
      return <p className="text-sm text-gray-500">No preventive actions available.</p>;
    }

    return (
      <div className="space-y-4">
        {result.preventive_actions.map((action, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{idx + 1}</span>
            </div>
            <p className="flex-1 text-sm text-gray-700">{action}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderPolicyRefs = () => {
    if (!result?.policy_refs || result.policy_refs.length === 0) {
      return <p className="text-sm text-gray-500">No policy references available.</p>;
    }

    return (
      <div className="space-y-3">
        {result.policy_refs.map((policy, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{idx + 1}</span>
            </div>
            <p className="flex-1 text-sm text-gray-700">{policy}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 border border-gray-200">
        <DialogHeader className="border-b border-gray-200 pb-3 px-6 pt-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">AI Recommended Actions</DialogTitle>
            {/* <div className="flex items-center gap-2">
              {!isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={handleRefresh}
                  title="Refresh recommendations"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div> */}
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && result && (
            <>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="immediate">Immediate</TabsTrigger>
                  <TabsTrigger value="corrective">Corrective</TabsTrigger>
                  <TabsTrigger value="preventive">Preventive</TabsTrigger>
                  <TabsTrigger value="policy">Policy</TabsTrigger>
                </TabsList>

                <TabsContent value="immediate" className="mt-0">
                  <Card className="border border-gray-200 shadow-none max-h-[60vh] overflow-y-auto">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-blue-600 mb-4">Immediate Actions</h3>
                      {renderImmediateActions()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="corrective" className="mt-0">
                  <Card className="border border-gray-200 shadow-none max-h-[60vh] overflow-y-auto">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-blue-600 mb-4">Corrective Actions</h3>
                      {renderCorrectiveActions()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preventive" className="mt-0">
                  <Card className="border border-gray-200 shadow-none max-h-[60vh] overflow-y-auto">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-blue-600 mb-4">Preventive Actions</h3>
                      {renderPreventiveActions()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="policy" className="mt-0">
                  <Card className="border border-gray-200 shadow-none max-h-[60vh] overflow-y-auto">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-blue-600 mb-4">Policy References</h3>
                      {renderPolicyRefs()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
          <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIRecommendationDialog;
