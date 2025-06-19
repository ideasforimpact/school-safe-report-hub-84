
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AuthDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientsData, setClientsData] = useState<any>(null);

  const runDebug = async () => {
    setLoading(true);
    try {
      // Call the debug function
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_auth_info');
      
      if (debugError) {
        console.error('Debug error:', debugError);
        toast.error(`Debug error: ${debugError.message}`);
      } else {
        setDebugInfo(debugData);
        console.log('Debug info:', debugData);
      }

      // Try to fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      
      if (clientsError) {
        console.error('Clients fetch error:', clientsError);
        setClientsData({ error: clientsError.message });
      } else {
        setClientsData({ success: true, count: clients?.length || 0, data: clients });
        console.log('Clients data:', clients);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testOriginalFunction = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_backoffice_admin');
      
      if (error) {
        console.error('is_backoffice_admin error:', error);
        toast.error(`Original function error: ${error.message}`);
      } else {
        console.log('is_backoffice_admin result:', data);
        toast.success(`Original function result: ${data}`);
      }
    } catch (error) {
      console.error('Original function test error:', error);
    }
  };

  const testUidFunction = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_backoffice_admin_by_uid');
      
      if (error) {
        console.error('is_backoffice_admin_by_uid error:', error);
        toast.error(`UID function error: ${error.message}`);
      } else {
        console.log('is_backoffice_admin_by_uid result:', data);
        toast.success(`UID function result: ${data}`);
      }
    } catch (error) {
      console.error('UID function test error:', error);
    }
  };

  useEffect(() => {
    // Run debug automatically when component mounts
    runDebug();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDebug} disabled={loading}>
              {loading ? 'Running Debug...' : 'Run Debug'}
            </Button>
            <Button onClick={testOriginalFunction} variant="outline">
              Test Original Function
            </Button>
            <Button onClick={testUidFunction} variant="outline">
              Test UID Function
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-2">
              <h3 className="font-semibold">Debug Results:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {clientsData && (
            <div className="space-y-2">
              <h3 className="font-semibold">Clients Fetch Results:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(clientsData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugger;
