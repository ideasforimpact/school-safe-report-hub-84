
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';
import { ConnectSchoolProvider } from './contexts/ConnectSchoolContext';

const AppWrapper = () => {
  return (
    <Router>
      <EmployeeProvider>
        <AuthProvider>
          <ConnectSchoolProvider>
            <App />
          </ConnectSchoolProvider>
        </AuthProvider>
      </EmployeeProvider>
    </Router>
  );
};

export default AppWrapper;
