
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident } from '@/contexts/IncidentContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Ticket, BanIcon } from 'lucide-react';

interface IncidentsCardViewProps {
  incidents: Incident[];
}

const IncidentsCardView: React.FC<IncidentsCardViewProps> = ({ incidents }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string, isVoided?: boolean) => {
    if (isVoided) {
      return 'bg-red-100 text-red-800';
    }
    
    switch(status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority: string | undefined) => {
    switch(priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No incidents found matching your filters</p>
      </div>
    );
  }

  const handleCardClick = (incidentId: string) => {
    navigate(`/incident/${incidentId}`);
  };

  const handleEditClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incident/${incidentId}/edit`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {incidents.map((incident) => (
        <Card 
          key={incident.id} 
          className={`cursor-pointer hover:shadow-md transition-all ${incident.isVoided ? 'bg-red-50' : ''}`}
          onClick={() => handleCardClick(incident.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Ticket className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">{incident.ticketId}</span>
                {incident.isVoided && (
                  <BanIcon className="h-4 w-4 ml-2 text-red-600" />
                )}
              </div>
              <Badge className={getPriorityBadgeClass(incident.priority)}>
                {incident.priority || 'Medium'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <div className="mb-2">
              <Badge variant="outline" className="mr-2">{incident.type}</Badge>
              <Badge className={getStatusBadgeClass(incident.status, incident.isVoided)}>
                {incident.isVoided ? 'Voided' : incident.status}
              </Badge>
            </div>
            <p className="font-medium">{incident.category}</p>
            {incident.subcategory && (
              <p className="text-sm text-gray-600">{incident.subcategory}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Reported: {formatDate(incident.date)}
            </p>
          </CardContent>
          
          <CardFooter className="pt-0 flex justify-end space-x-2 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600"
            >
              Update
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => handleEditClick(e, incident.id)}
              disabled={incident.isVoided}
              className="text-blue-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default IncidentsCardView;
