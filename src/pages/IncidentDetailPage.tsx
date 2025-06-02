
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Incident, IncidentStatus } from '@/types/incident';
import { useIncidents } from '@/contexts/IncidentContext';
import IncidentDetails from '@/components/incident/IncidentDetails';
import PeopleInvolvedList from '@/components/incident/PeopleInvolvedList';
import IncidentDocuments from '@/components/incident/IncidentDocuments';
import CommentsList from '@/components/incident/CommentsList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const IncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident } = useIncidents();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>('Open');

  useEffect(() => {
    if (id) {
      const incidentData = getIncident(id);
      if (incidentData) {
        setIncident(incidentData);
        setStatusUpdate(incidentData.status);
      }
    }
  }, [id, getIncident]);

  const handleStatusChange = () => {
    if (incident && statusUpdate !== incident.status) {
      updateIncident(incident.id, { status: statusUpdate });
      setIncident(prev => prev ? { ...prev, status: statusUpdate } : null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!id) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Invalid URL</AlertTitle>
            <AlertDescription className="ml-2">
              No incident ID provided in the URL.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Incident not found</AlertTitle>
            <AlertDescription className="ml-2">
              The incident you're looking for doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  const canEdit = incident.status !== 'Closed' && !incident.isVoided;

  return (
    <Layout>
      <div className="space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/incidents')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Incidents
                </Button>
                
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {incident.ticketId}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDistanceToNow(incident.createdAt)} ago
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    onClick={() => navigate(`/incident/${id}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Incident
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.print()}>
                      Print Report
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Export to PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <IncidentDetails
                incident={incident}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                getStatusColor={getStatusColor}
                handleStatusChange={handleStatusChange}
                statusUpdate={statusUpdate}
                setStatusUpdate={setStatusUpdate}
                updateIncident={updateIncident}
              />

              {/* Documents Section */}
              <IncidentDocuments
                incidentId={incident.id}
                canEdit={canEdit}
              />

              {/* People Involved */}
              {incident.peopleInvolved && incident.peopleInvolved.length > 0 && (
                <PeopleInvolvedList people={incident.peopleInvolved} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Comments */}
              <CommentsList incidentId={incident.id} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetailPage;
