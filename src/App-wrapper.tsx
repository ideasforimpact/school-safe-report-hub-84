
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './store/EmployeeContext';
import { ClientProvider } from './contexts/ClientContext';

const STALE_MINUTES = Number(import.meta.env.VITE_QUERY_STALE_TIME_MINUTES) || 3;
const STALE_TIME = STALE_MINUTES * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: STALE_TIME,
      gcTime: STALE_TIME * 2,
      refetchOnWindowFocus: false,
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
