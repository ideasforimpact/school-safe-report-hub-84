
import { useNavigate } from 'react-router-dom';

export function useIncidentTableNavigation() {
  const navigate = useNavigate();
  
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

  return {
    handleRowClick,
    handleViewClick,
    handleEditClick
  };
}
