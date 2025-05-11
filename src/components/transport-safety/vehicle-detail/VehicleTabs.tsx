
import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/dateUtils';
import { History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface VehicleTabsProps {
  vehicleId: string;
}

const VehicleTabs: React.FC<VehicleTabsProps> = ({ vehicleId }) => {
  const { getVehicle } = useTransportSafety();
  const [showVerificationDetails, setShowVerificationDetails] = React.useState(false);
  const [selectedVerificationData, setSelectedVerificationData] = React.useState<any>(null);
  
  const vehicle = getVehicle(vehicleId);
  
  // Find verification log entry to get history
  const getVerificationLog = () => {
    if (!vehicle?.verificationData) return null;
    
    const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
    return logEntry?.value || null;
  };
  
  const verificationLog = getVerificationLog();
  
  // Get verification history entries sorted by date (newest first)
  const getVerificationHistory = () => {
    if (!verificationLog) return [];
    
    return Object.entries(verificationLog)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, data]) => ({
        date,
        data
      }));
  };
  
  const verificationHistory = getVerificationHistory();
  
  const formatVerificationData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter((item: any) => item.field !== 'verification_log' && item.field !== 'last_response' && item.field !== 'status')
      .map((item: any) => ({
        label: item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.value
      }));
  };
  
  const viewVerificationDetails = (data: any) => {
    setSelectedVerificationData(data);
    setShowVerificationDetails(true);
  };
  
  return (
    <Tabs defaultValue="documents">
      <TabsList className="mb-4">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="documents" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">Vehicle Documents</h2>
        <p className="text-gray-500 text-left">
          For detailed document management, including verification and updates, please visit the 
          <Link to={`/transport-safety/${vehicleId}/documents`} className="text-primary ml-1">Document Management</Link> page.
        </p>
      </TabsContent>
      
      <TabsContent value="history" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">Verification History</h2>
        
        {!verificationHistory.length && (
          <p className="text-gray-500 text-left">No verification history available for this vehicle.</p>
        )}
        
        {verificationHistory.length > 0 && (
          <div className="space-y-4">
            {verificationHistory.map((entry, idx) => (
              <div key={idx} className="border rounded-md p-4">
                <h4 className="font-medium mb-2">
                  {new Date(entry.date).toLocaleString()}
                </h4>
                <div className="text-xs text-gray-500 mb-2">
                  Verification status: <span className={
                    Array.isArray(entry.data) && 
                    entry.data.find((i: any) => i.field === 'status')?.value === 'active' ? 
                    'text-green-600' : 'text-amber-600'
                  }>
                    {Array.isArray(entry.data) ? 
                      String(entry.data.find((i: any) => i.field === 'status')?.value || 'Unknown').toUpperCase() : 
                      'Unknown'
                    }
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => viewVerificationDetails(entry.data)}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
      
      {/* Verification Details Dialog */}
      <Dialog open={showVerificationDetails} onOpenChange={setShowVerificationDetails}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
            <DialogDescription>
              Registration details verified through Surepass API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md divide-y">
            {formatVerificationData(selectedVerificationData).map((field: any, index: number) => (
              <div key={index} className="flex justify-between px-4 py-2">
                <span className="font-medium text-gray-500">{field.label}:</span>
                <span className="text-gray-900">{typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value)}</span>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowVerificationDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default VehicleTabs;
