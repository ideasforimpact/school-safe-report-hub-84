import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  incident?: any | null; // full incident object with recommended_action
  onRefresh?: () => void | Promise<void>; // Callback to refresh incident list after saving
};

type AiResult = {
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediate_actions: string[];
  corrective_actions: { action: string; due_days: number }[];
  preventive_actions: string[];
  policy_refs: string[];
};

export const AIRecommendationDialog: React.FC<AIRecommendationDialogProps> = ({ open, onOpenChange, incidentJson, incidentId, incident, onRefresh }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AiResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<'immediate' | 'corrective' | 'preventive' | 'policy'>('immediate');
  const [showConsentDialog, setShowConsentDialog] = React.useState(false);
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
          } else {
            // Successfully saved - trigger refresh if callback provided
            if (onRefresh) {
              await onRefresh();
            }
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
    if (open) {
      // Check if incident has existing recommended_action
      // Check multiple possible field names for compatibility
      const existingRecommendation = incident?.recommended_action 
        || incident?.recommendedAction 
        || (incident as any)?.recommended_action;
      
      console.log('Checking for existing recommendation:', {
        hasIncident: !!incident,
        recommended_action: incident?.recommended_action,
        recommendedAction: incident?.recommendedAction,
        incidentKeys: incident ? Object.keys(incident) : [],
        incident
      });
      
      if (existingRecommendation) {
        // Use existing recommendation instead of calling API
        console.log('Using existing recommended_action from database:', existingRecommendation);
        try {
          // Handle both JSON string and object formats
          const parsed = typeof existingRecommendation === 'string' 
            ? JSON.parse(existingRecommendation) 
            : existingRecommendation;
          setResult(parsed as AiResult);
          setIsLoading(false);
          setError(null);
        } catch (e) {
          console.error('Error parsing existing recommendation:', e);
          // Fall back to calling API if parsing fails
          if (incidentJson) {
            callEdgeFunction();
          }
        }
      } else if (incidentJson) {
        // No existing recommendation, call API
        console.log('No existing recommendation found, calling API');
        callEdgeFunction();
      }
    } else {
      setIsLoading(false);
      setError(null);
      setResult(null);
    }
  }, [open, incident, incidentJson, callEdgeFunction]);

  const handleRefreshClick = () => {
    setShowConsentDialog(true);
  };

  const handleConsentConfirm = () => {
    setShowConsentDialog(false);
    if (incidentJson) {
      callEdgeFunction();
    }
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
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
              {item.due_days && (
                <p className="text-xs text-gray-500">
                  Due in {item.due_days} days
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
          <DialogTitle className="text-xl font-semibold">AI Recommended Actions</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="flex justify-end mb-2">
            {!isLoading && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleRefreshClick}
                title="Refresh recommendations"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefreshClick}>
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
          <Button 
            onClick={async () => {
              // Always refresh the incident list when OK is clicked
              // This ensures the list is updated whether we just saved a new recommendation
              // or are viewing an existing one
              if (onRefresh) {
                await onRefresh();
              }
              onOpenChange(false);
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            OK
          </Button>
        </div>
      </DialogContent>

      {/* Consent Dialog for Refresh */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refresh AI Recommendations</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the AI recommendations? This will call the AI service again and may take a few moments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This action will generate new AI recommendations based on the current incident data. The previous recommendations will be replaced with the new ones.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleConsentCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsentConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AIRecommendationDialog;
