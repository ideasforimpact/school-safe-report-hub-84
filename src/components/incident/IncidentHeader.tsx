
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, User, Building2, MapPin, AlertTriangle, X, RotateCcw, Brain } from 'lucide-react';
import { Incident, IncidentStatus } from '@/types/incident';
import { useNavigate } from 'react-router-dom';
import { useIncidentReopen } from '@/hooks/useIncidentReopen';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useIncidentPermissions } from '@/utils/incidentPermissions';
import ReopenIncidentDialog from '@/features/incident/ReopenIncidentDialog';
import AIRecommendationDialog from '@/components/incidents/AIRecommendationDialog';
import { supabase } from '@/integrations/supabase/client';

interface IncidentHeaderProps {
  incident: Incident;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  onCloseButtonClick?: () => void;
  onIncidentUpdate?: () => void;
}

const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  incident,
  statusUpdate,
  setStatusUpdate,
  onStatusChange,
  formatDate,
  getStatusColor,
  onCloseButtonClick,
  onIncidentUpdate
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleReopenIncident, isReopening } = useIncidentReopen();
  const { checkPermissions } = useIncidentPermissions();

  // Reopen dialog state
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPayload, setAiPayload] = useState<any | null>(null);
  const [policyTitles, setPolicyTitles] = useState<string[]>([]);

  React.useEffect(() => {
    const loadPolicyDocs = async () => {
      try {
        const clientId = (user as any)?.clientId || (user as any)?.client?.id;
        if (!clientId) return;
        const { data, error } = await supabase.functions.invoke('edusafe-resource-client', {
          body: { action: 'fetch_resources', data: { client_id: clientId } }
        });
        if (error) return;
        const titles = (data?.resources || []).map((r: any) => r?.title).filter(Boolean);
        setPolicyTitles(titles);
      } catch (_) {
        // ignore
      }
    };
    loadPolicyDocs();
  }, [user]);

  const handleAiClick = () => {
    const payload: any = {
      id: (incident as any).id,
      category: (incident as any).category,
      sub_category: (incident as any).subcategory,
      facility: (incident as any).facility,
      location: (incident as any).location,
      description: (incident as any).description,
      root_cause: (incident as any).root_cause ?? (incident as any).root_cause_analysis ?? null,
      learning_points: (incident as any).learning_points ?? null,
      action_taken: (incident as any).action_taken ?? null,
      policy_docs: policyTitles,
    };
    setAiPayload(payload);
    setAiOpen(true);
  };

  // Get permissions for this specific incident
  const permissions = React.useMemo(() => {
    if (!incident.reportedBy?.id) return { canEdit: false, canClose: false, canReopen: false };
    
    return checkPermissions(
      incident.reportedBy.id,
      incident.owner?.id
    );
  }, [incident.reportedBy?.id, incident.owner?.id, checkPermissions]);

  const handleEditClick = () => {
    console.log("Navigating to edit incident:", incident.id);
    navigate(`/incident/${incident.id}/edit`);
  };

  const handleCloseIncident = () => {
    if (onCloseButtonClick) {
      onCloseButtonClick();
    }
  };

  const handleReopenClick = () => {
    setReopenReason('');
    setShowReopenDialog(true);
  };

  const handleConfirmReopen = async () => {
    if (!user?.id) {
      console.error('No user ID available for reopening incident');
      return;
    }

    if (!reopenReason.trim()) {
      return;
    }

    const success = await handleReopenIncident(
      incident.id,
      user.id,
      reopenReason.trim(),
      () => {
        // On success callback - refresh the incident data
        if (onIncidentUpdate) {
          onIncidentUpdate();
        }
      }
    );

    if (success) {
      setShowReopenDialog(false);
      setReopenReason('');
      console.log('Incident reopened successfully');
    }
  };

  // Enhanced status text to show reopened info
  const getStatusText = () => {
    const reopenCount = incident.reopen || 0;
    if (incident.status === 'Open' && reopenCount > 0) {
      return `Open (Reopened)`;
    }
    return incident.status;
  };

  // Enhanced status color with consistent background
  const getEnhancedStatusColor = (status: IncidentStatus) => {
    const reopenCount = incident.reopen || 0;
    const baseColor = getStatusColor(status);
    
    switch(status) {
      case 'Open':
        if (reopenCount > 0) {
          return 'bg-orange-500 text-white border-orange-500';
        }
        return 'bg-red-500 text-white border-red-500';
      case 'In Progress':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'Closed':
        return 'bg-green-500 text-white border-green-500';
      case 'New':
        return 'bg-blue-500 text-white border-blue-500';
      case 'On Hold':
        return 'bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-gray-500 text-white border-gray-500';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {incident.ticketId}
              </CardTitle>
              <Badge 
                variant="secondary" 
                className={`${getEnhancedStatusColor(incident.status)} font-medium px-3 py-1`}
              >
                {getStatusText()}
              </Badge>
            </div>
            <p className="text-gray-600 font-medium">
              {incident.type} - {incident.category}
            </p>
            {incident.subcategory && (
              <p className="text-sm text-gray-500">
                {incident.subcategory}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Show Reopen button only if incident is Closed, not voided, and user has permission */}
            {incident.status === 'Closed' && !incident.isVoided && permissions.canReopen && (
              <Button 
                onClick={handleReopenClick}
                disabled={isReopening}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isReopening ? 'Reopening...' : 'Reopen'}
              </Button>
            )}

            {/* Show Close button only if incident is Open, not voided, and user has permission */}
            {incident.status === 'Open' && !incident.isVoided && permissions.canClose && (
              <Button 
                onClick={handleCloseIncident}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            )}
            
            {/* Show Edit button only if not voided, not closed, and user has permission */}
            {!incident.isVoided && incident.status !== 'Closed' && permissions.canEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiClick}
              className="flex items-center gap-2"
              title="AI Recommendations"
            >
              <Brain className="h-4 w-4 text-purple-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDate(incident.date)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{incident.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Facility:</span>
            <span className="font-medium">{incident.facility || 'Not specified'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Reported by:</span>
            <span className="font-medium">{incident.reportedBy.name}</span>
          </div>
          
          {incident.priority && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Priority:</span>
              <span className="font-medium">{incident.priority}</span>
            </div>
          )}
          
          {incident.owner && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Assigned to:</span>
              <span className="font-medium">{incident.owner.name}</span>
            </div>
          )}


        </div>
      </CardContent>
      <AIRecommendationDialog open={aiOpen} onOpenChange={setAiOpen} incidentJson={aiPayload} incidentId={(incident as any).id} />
      
      <ReopenIncidentDialog
        open={showReopenDialog}
        onOpenChange={setShowReopenDialog}
        reopenReason={reopenReason}
        onReopenReasonChange={setReopenReason}
        onConfirm={handleConfirmReopen}
      />
    </Card>
  );
};

export default IncidentHeader;
