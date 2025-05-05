
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
import { Edit, Ticket, BanIcon, AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar, Building2 } from 'lucide-react';

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
        return <AlertCircle className="h-4 w-4 text-red-600" aria-label="Critical Priority" />;
      case 'High':
        return <ArrowUp className="h-4 w-4 text-orange-500" aria-label="High Priority" />;
      case 'Medium':
        return <ArrowRight className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
      case 'Low':
        return <ArrowDown className="h-4 w-4 text-green-600" aria-label="Low Priority" />;
      default:
        return <ArrowRight className="h-4 w-4 text-yellow-600" aria-label="Medium Priority" />;
    }
  };

  // Function to extract simple numeric ID from ticket ID (1-1000)
  const getSimpleId = (ticketId: string): string => {
    // Extract numbers from the ticket ID and convert to number
    const numbers = ticketId.match(/\d+/g);
    if (!numbers || numbers.length === 0) return "1";
    
    // Get the first number and ensure it's between 1 and 1000
    const idNumber = parseInt(numbers[0], 10) % 1000;
    return idNumber === 0 ? "1000" : idNumber.toString();
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
              <TableHead>ID</TableHead>
              <TableHead className="text-left">Date</TableHead>
              <TableHead className="text-left">Category</TableHead>
              <TableHead className="text-left">Priority</TableHead>
              <TableHead className="text-left">Location</TableHead>
              <TableHead className="text-left">Facility</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Actions</TableHead>
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
                    <span className="ml-1">{getSimpleId(incident.ticketId)}</span>
                    {incident.isVoided && (
                      <BanIcon className="h-4 w-4 ml-2 text-red-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDate(incident.date)}
                  </div>
                </TableCell>
                <TableCell className="text-left">{incident.category}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    {getPriorityIcon(incident.priority)}
                    <span className="ml-2">{incident.priority || 'Medium'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-left">{incident.location}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    {incident.facility || 'Not specified'}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status, incident.isVoided)}`}>
                    {incident.isVoided ? 'Voided' : incident.status}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex space-x-2">
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
