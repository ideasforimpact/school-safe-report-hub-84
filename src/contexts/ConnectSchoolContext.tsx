
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ConnectSchoolContextType {
  supabaseConnectSchool: SupabaseClient | null;
  isConnected: boolean;
}

const ConnectSchoolContext = createContext<ConnectSchoolContextType>({
  supabaseConnectSchool: null,
  isConnected: false
});

export const useConnectSchool = () => {
  const context = useContext(ConnectSchoolContext);
  if (!context) {
    throw new Error('useConnectSchool must be used within ConnectSchoolProvider');
  }
  return context;
};

interface ConnectSchoolProviderProps {
  children: React.ReactNode;
}

export const ConnectSchoolProvider: React.FC<ConnectSchoolProviderProps> = ({ children }) => {
  const [supabaseConnectSchool, setSupabaseConnectSchool] = useState<SupabaseClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize ConnectSchool database connection
    // You would need to set up separate environment variables for ConnectSchool database
    const connectSchoolUrl = import.meta.env.VITE_CONNECTSCHOOL_SUPABASE_URL;
    const connectSchoolAnonKey = import.meta.env.VITE_CONNECTSCHOOL_SUPABASE_ANON_KEY;

    if (connectSchoolUrl && connectSchoolAnonKey) {
      const client = createClient(connectSchoolUrl, connectSchoolAnonKey);
      setSupabaseConnectSchool(client);
      setIsConnected(true);
      console.log('ConnectSchool database connected');
    } else {
      console.warn('ConnectSchool database credentials not found. Using fallback configuration.');
      // Fallback to main database for development
      const mainUrl = import.meta.env.VITE_SUPABASE_URL;
      const mainAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (mainUrl && mainAnonKey) {
        const client = createClient(mainUrl, mainAnonKey);
        setSupabaseConnectSchool(client);
        setIsConnected(true);
      }
    }
  }, []);

  return (
    <ConnectSchoolContext.Provider value={{ supabaseConnectSchool, isConnected }}>
      {children}
    </ConnectSchoolContext.Provider>
  );
};
