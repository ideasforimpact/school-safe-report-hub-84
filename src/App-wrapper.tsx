
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';
import { ClientProvider } from './contexts/ClientContext';

const AppWrapper = () => {
  return (
    <Router>
      <EmployeeProvider>
        <ClientProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ClientProvider>
      </EmployeeProvider>
    </Router>
  );
};

export default AppWrapper;
