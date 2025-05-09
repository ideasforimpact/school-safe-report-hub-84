
import { useNavigate } from 'react-router-dom';

export function useIncidentTableNavigation() {
  const navigate = useNavigate();
  
  const handleRowClick = (incidentId: string) => {
    navigate(`/incidents/${incidentId}`);
  };

  const handleViewClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incidents/${incidentId}`);
  };

  const handleEditClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incidents/${incidentId}/edit`);
  };

  return {
    handleRowClick,
    handleViewClick,
    handleEditClick
  };
}
