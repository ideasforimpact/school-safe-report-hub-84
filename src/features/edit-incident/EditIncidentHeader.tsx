import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface EditIncidentHeaderProps {
  isVoided?: boolean;
  onVoidClick: () => void;
  ticketId?: string;
}
const EditIncidentHeader: React.FC<EditIncidentHeaderProps> = ({
  isVoided,
  onVoidClick,
  ticketId
}) => {
  const navigate = useNavigate();
  return <>
      <div className="w-full flex">
        <Button variant="ghost" className="-ml-4 flex items-center" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-left">Edit Incident</h1>
          {ticketId && <p className="text-gray-600 mt-1">
              Ticket ID: <span className="font-medium">{ticketId}</span>
            </p>}
        </div>
        
        {!isVoided && <Button onClick={onVoidClick} variant="destructive" size="sm" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Void Incident
          </Button>}
      </div>
    </>;
};
export default EditIncidentHeader;