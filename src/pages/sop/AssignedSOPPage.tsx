import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { useClient } from '@/contexts/ClientContext';

interface SOP {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  description: string | null;
  status: boolean;
  procedure_steps: string[];
  important_notes: string | null;
  client_id: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
}

const AssignedSOPPage = () => {
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { client } = useClient();
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedSOPs();
  }, []);

  const fetchAssignedSOPs = async () => {
    setLoading(true);
    try {
      const clientId = client?.id || null;
      const employeeId = employeeData?.id || null;

      if (!clientId || !employeeId) {
        toast.error('Client ID or Employee ID not found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-assigned-sop', {
        body: {
          client_id: clientId,
          employee_id: employeeId,
        },
      });

      if (error) {
        console.error('Error fetching assigned SOPs:', error);
        toast.error('Failed to load assigned SOPs');
        return;
      }

      if (data && data.error) {
        toast.error(data.error || 'Failed to load assigned SOPs');
        return;
      }

      if (data && data.success) {
        setSops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assigned SOPs:', error);
      toast.error('Failed to load assigned SOPs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sops')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Assigned SOP</h1>
                <p className="text-gray-600 mt-1">
                  View SOPs assigned to you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading assigned SOPs...</p>
            </div>
          ) : sops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No assigned SOPs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sops.map((sop) => (
                <div
                  key={sop.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{sop.title}</h3>
                      {sop.category_name && (
                        <p className="text-sm text-gray-500 mt-1">
                          Category: {sop.category_name}
                        </p>
                      )}
                      {sop.description && (
                        <p className="text-gray-600 mt-2">{sop.description}</p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Procedure Steps:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          {sop.procedure_steps.map((step, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {sop.important_notes && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm font-medium text-yellow-800">Important Notes:</p>
                          <p className="text-sm text-yellow-700 mt-1">{sop.important_notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sop.status
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {sop.status ? 'Active' : 'To Be Done'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AssignedSOPPage;



