
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, User, Building2, MapPin, AlertTriangle, X } from 'lucide-react';
import { Incident, IncidentStatus } from '@/types/incident';
import { useNavigate } from 'react-router-dom';

interface IncidentHeaderProps {
  incident: Incident;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  onStatusChange: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  onCloseButtonClick?: () => void;
}

const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  incident,
  statusUpdate,
  setStatusUpdate,
  onStatusChange,
  formatDate,
  getStatusColor,
  onCloseButtonClick
}) => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    console.log("Navigating to edit incident:", incident.id);
    navigate(`/incident/${incident.id}/edit`);
  };

  const handleCloseIncident = () => {
    if (onCloseButtonClick) {
      onCloseButtonClick();
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
                className={`${getStatusColor(incident.status)} text-white font-medium px-3 py-1`}
              >
                {incident.status}
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
            {/* Show Close button only if incident is Open and not voided */}
            {incident.status === 'Open' && !incident.isVoided && (
              <Button 
                onClick={handleCloseIncident}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            )}
            
            {/* Always show Edit button (unless voided) */}
            {!incident.isVoided && (
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
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{incident.owner.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentHeader;
