
import { Navigate } from 'react-router-dom';

const ConfigurationManagement = () => {
  // Redirect to the incident configuration page as default
  return <Navigate to="/incident-configuration" replace />;
};

export default ConfigurationManagement;
