
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [clientsTest, setClientsTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { employeeData } = useAuth();

  const runDebugTest = async () => {
    setIsLoading(true);
    try {
      // Test the debug function
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_backoffice_auth');
      
      console.log('Debug function result:', debugData);
      console.log('Debug function error:', debugError);

      // Try to fetch clients to see what happens
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(5);

      console.log('Clients fetch result:', clientsData);
      console.log('Clients fetch error:', clientsError);

      // Test the alternative auth function
      const { data: altAuthData, error: altAuthError } = await supabase
        .rpc('is_backoffice_admin_by_uid');

      console.log('Alternative auth result:', altAuthData);
      console.log('Alternative auth error:', altAuthError);

      setDebugInfo({
        debugFunction: { data: debugData, error: debugError },
        clientsFetch: { data: clientsData, error: clientsError },
        alternativeAuth: { data: altAuthData, error: altAuthError },
        currentEmployee: employeeData
      });

    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run on component mount
    runDebugTest();
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-red-600">🐛 Debug Mode - Authentication Issue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runDebugTest} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Running Tests...' : 'Run Debug Tests'}
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Debug Authentication Info:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.debugFunction, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Clients Fetch Test:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.clientsFetch, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Alternative Auth Test:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.alternativeAuth, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Current Employee Context:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo.currentEmployee, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;
