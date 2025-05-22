
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';
import { EmployeeValidationProvider } from './providers/EmployeeValidationProvider';

const AppWrapper = () => {
  return (
    <Router>
      <EmployeeProvider>
        <AuthProvider>
          <EmployeeValidationProvider>
            <App />
          </EmployeeValidationProvider>
        </AuthProvider>
      </EmployeeProvider>
    </Router>
  );
};

export default AppWrapper;
