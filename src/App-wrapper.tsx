
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';
import { ClientProvider } from './contexts/ClientContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppWrapper = () => {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <EmployeeProvider>
          <ClientProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ClientProvider>
        </EmployeeProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default AppWrapper;
