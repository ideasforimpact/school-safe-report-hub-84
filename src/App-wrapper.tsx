
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';

const AppWrapper = () => {
  return (
    <Router>
      <EmployeeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </EmployeeProvider>
    </Router>
  );
};

export default AppWrapper;
