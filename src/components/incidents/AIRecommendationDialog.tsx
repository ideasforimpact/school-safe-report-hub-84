import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const SYSTEM_PROMPT = `You are a School Safety and Compliance Assistant for an Indian K-12 school group.

Your task is to review the incident data collected from the Safe School System and return practical, school-specific recommendations.

Respond ONLY in valid JSON format, following the structure below.

### Output Schema
{
  "summary": "string (1–2 sentences summarizing what likely happened)",
  "severity": "low | medium | high | critical",
  "immediate_actions": ["string"],
  "corrective_actions": [
    {
      "action": "string",
      "owner_role": "string",
      "due_days": "integer",
      "evidence_required": ["string"]
    }
  ],
  "preventive_actions": ["string"],
  "policy_refs": ["string"]
}

### Rules & Constraints
- Each "action" must be a clear, meaningful sentence of up to 250 characters.
- Provide *minimum 2* and *maximum 5* actions for each action type (immediate, corrective, preventive).
- Focus on school safety, compliance, and accountability.
- Use short, direct, actionable language starting with a verb.
- Avoid personal identifiers (names, photos, IDs).
- Follow CBSE / State Board norms for safety and compliance.
- Ensure actions are practical and context-specific (for Indian school settings).
- Return only valid JSON — no extra text, headers, or explanations.
- If no relevant policy applies, return an empty array for "policy_refs".

### Example Output
{
  "summary": "A student slipped in the library due to wet flooring after rain.",
  "severity": "medium",
  "immediate_actions": [
    "Provide first aid to the injured student and monitor condition.",
    "Clean and dry the affected area to prevent further accidents."
  ],
  "corrective_actions": [
    {
      "action": "Inspect the library floor and fix drainage or leakage issues.",
      "owner_role": "Facility Manager",
      "due_days": 3,
      "evidence_required": ["Inspection report", "Repair documentation"]
    },
    {
      "action": "Record the incident in the safety management system.",
      "owner_role": "Safety Officer",
      "due_days": 1,
      "evidence_required": ["Incident report"]
    }
  ],
  "preventive_actions": [
    "Install anti-slip mats at library entrances.",
    "Conduct periodic floor safety checks after rain."
  ],
  "policy_refs": [
    "Accident and Incident Reporting Policy",
    "First Aid and Emergency Medical Response Policy"
  ]
}`;

export const AIRecommendationDialog: React.FC<AIRecommendationDialogProps> = ({ open, onOpenChange, incidentJson, incidentId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AiResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<'immediate' | 'corrective' | 'preventive' | 'policy'>('immediate');
  const { toast } = useToast();

  // Read env at build-time via Vite (requires prefix VITE_ and a dev server restart after changes)
  const apiKey = "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"

  const callOpenAI = React.useCallback(async () => {
    if (!incidentJson) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Input: ${JSON.stringify(incidentJson)}` }
      ];

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Set VITE_OPENAI_API_KEY in your .env and restart the dev server.');
      }
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.2,
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`OpenAI error: ${t}`);
      }

      const data = await resp.json();
      const content: string = data?.choices?.[0]?.message?.content || '';
      // Expecting pure JSON. Attempt to parse; if wrapped, try to extract
      let parsed: any = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}$/);
        if (match) parsed = JSON.parse(match[0]);
      }
      if (!parsed) throw new Error('Failed to parse AI response as JSON');

      setResult(parsed as AiResult);

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
      setError(e?.message || 'Failed to generate AI recommendation');
    } finally {
      setIsLoading(false);
    }
  }, [incidentJson, apiKey, incidentId, toast]);

  React.useEffect(() => {
    if (open && incidentJson) {
      callOpenAI();
    } else if (!open) {
      setIsLoading(false);
      setError(null);
      setResult(null);
    }
  }, [open, incidentJson, callOpenAI]);

  const handleRefresh = () => {
    if (incidentJson) {
      callOpenAI();
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
