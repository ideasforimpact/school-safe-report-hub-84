
import { useNavigate } from 'react-router-dom';
import { Incident, IncidentStatus } from '@/contexts/IncidentContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Ticket, BanIcon, AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface IncidentsTableProps {
  incidents: Incident[];
}

const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: IncidentStatus, isVoided?: boolean) => {
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

  const getPriorityIcon = (priority: string | undefined) => {
    switch(priority) {
      case 'Critical':
        return <AlertCircle className="h-4 w-4 text-red-600" title="Critical Priority" />;
      case 'High':
        return <ArrowUp className="h-4 w-4 text-orange-500" title="High Priority" />;
      case 'Medium':
        return <ArrowRight className="h-4 w-4 text-yellow-600" title="Medium Priority" />;
      case 'Low':
        return <ArrowDown className="h-4 w-4 text-green-600" title="Low Priority" />;
      default:
        return <ArrowRight className="h-4 w-4 text-yellow-600" title="Medium Priority" />;
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">No incidents found matching your filters</p>
        </div>
      </div>
    );
  }

  const handleRowClick = (incidentId: string) => {
    navigate(`/incident/${incidentId}`);
  };

  const handleViewClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incident/${incidentId}`);
  };

  const handleEditClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incident/${incidentId}/edit`);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              {/* Type column removed */}
              <TableHead className="text-left">Category</TableHead>
              <TableHead className="text-left">Date</TableHead>
              {/* Priority column removed */}
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow 
                key={incident.id} 
                className={`cursor-pointer hover:bg-gray-50 ${incident.isVoided ? 'bg-red-50' : ''}`}
                onClick={() => handleRowClick(incident.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2 text-blue-600" />
                    {getPriorityIcon(incident.priority)}
                    <span className="ml-2">{incident.ticketId}</span>
                    {incident.isVoided && (
                      <BanIcon className="h-4 w-4 ml-2 text-red-600" />
                    )}
                  </div>
                </TableCell>
                {/* Type cell removed */}
                <TableCell className="text-left">{incident.category}</TableCell>
                <TableCell className="text-left">{formatDate(incident.date)}</TableCell>
                {/* Priority cell removed */}
                <TableCell className="text-left">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status, incident.isVoided)}`}>
                    {incident.isVoided ? 'Voided' : incident.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleViewClick(e, incident.id)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleEditClick(e, incident.id)}
                      disabled={incident.isVoided}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IncidentsTable;
