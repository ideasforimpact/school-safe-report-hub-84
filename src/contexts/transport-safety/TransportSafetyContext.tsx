import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TransportSafetyContextType, TransportSafetyProviderProps } from './types';
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { 
  getAllVehicles,
  getAllVehiclesWithChallans, 
  getVehicleById, 
  addVehicle as addVehicleService, 
  updateVehicle as updateVehicleService, 
  deleteVehicle as deleteVehicleService 
} from '@/services/transport-safety/vehicleService';
import { useAuth } from '@/contexts/auth';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useLocation } from 'react-router-dom';

const TransportSafetyContext = createContext<TransportSafetyContextType | undefined>(undefined);

export const useTransportSafety = () => {
  const context = useContext(TransportSafetyContext);
  if (!context) {
    throw new Error('useTransportSafety must be used within a TransportSafetyProvider');
  }
  return context;
};

export const TransportSafetyProvider: React.FC<TransportSafetyProviderProps> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, employeeData } = useAuth();
  const location = useLocation();
  const isUsersRoute = location.pathname === '/users';

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      if (!clientId) {
        console.log('No client ID available - cannot fetch vehicles');
        setVehicles([]);
        setLoading(false);
        return;
      }

      console.log('Fetching vehicles for client:', clientId);
      // Use getAllVehiclesWithChallans to include vehicle_challans data
      const vehiclesData = await getAllVehiclesWithChallans(clientId);
      
      console.log('Fetched vehicles:', vehiclesData);
      setVehicles(vehiclesData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles. Please try again later.');
      toast.error('Failed to load vehicles');
    } finally {
      setHasFetched(true);
      setLoading(false);
    }
  };

  // Fetch vehicles on component mount and when client changes
  useEffect(() => {
    if (isUsersRoute) {
      setVehicles([]);
      setLoading(false);
      return;
    }
    if (clientId) {
      fetchVehicles();
    } else {
      setVehicles([]);
      setLoading(false);
    }
  }, [clientId, isUsersRoute]);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => {
    try {
      if (!clientId) {
        toast.error('No client context available');
        return;
      }

      // Ensure client_id is set
      const dataWithClient = {
        ...vehicleData,
        clientId: clientId
      };

      const newVehicle = await addVehicleService(dataWithClient);
      
      if (newVehicle) {
        setVehicles([...vehicles, newVehicle]);
        toast.success(`${vehicleData.make} ${vehicleData.model} (${vehicleData.registrationNumber}) has been added`);
      }
    } catch (err) {
      console.error('Failed to add vehicle:', err);
      toast.error('Failed to add vehicle. Please try again.');
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const updatedVehicle = await updateVehicleService(id, updates);
      
      if (updatedVehicle) {
        setVehicles(vehicles.map(vehicle => 
          vehicle.id === id ? updatedVehicle : vehicle
        ));
        toast.success(`Vehicle updated successfully`);
      }
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      toast.error('Failed to update vehicle. Please try again.');
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const vehicleToDelete = vehicles.find(v => v.id === id);
      const success = await deleteVehicleService(id);
      
      if (success) {
        setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
        
        if (vehicleToDelete) {
          toast.success(`${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.registrationNumber}) has been deleted`);
        }
      }
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      toast.error('Failed to delete vehicle. Please try again.');
    }
  };

  const getVehicle = (id: string) => {
    return vehicles.find(vehicle => vehicle.id === id);
  };

  const addDocument = (vehicleId: string, document: Omit<VehicleDocument, 'id'>) => {
    const newDocument: VehicleDocument = {
      ...document,
      id: uuidv4()
    };

    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return {
          ...vehicle,
          documents: [...vehicle.documents, newDocument],
          updatedAt: new Date().toISOString()
        };
      }
      return vehicle;
    }));

    toast.success(`${document.type.charAt(0).toUpperCase() + document.type.slice(1)} document added successfully`);
  };

  const updateDocument = (vehicleId: string, documentId: string, updates: Partial<VehicleDocument>) => {
    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return {
          ...vehicle,
          documents: vehicle.documents.map(doc => 
            doc.id === documentId ? { ...doc, ...updates } : doc
          ),
          updatedAt: new Date().toISOString()
        };
      }
      return vehicle;
    }));
    
    toast.success(`${updates.type ? updates.type.charAt(0).toUpperCase() + updates.type.slice(1) : 'Document'} has been updated successfully`);
  };

  const deleteDocument = (vehicleId: string, documentId: string) => {
    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return {
          ...vehicle,
          documents: vehicle.documents.filter(doc => doc.id !== documentId),
          updatedAt: new Date().toISOString()
        };
      }
      return vehicle;
    }));

    toast.success("Document has been deleted successfully");
  };

  const verifyDocument = (vehicleId: string, documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual', notes?: string) => {
    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return {
          ...vehicle,
          documents: vehicle.documents.map(doc => {
            if (doc.id === documentId) {
              return {
                ...doc,
                verificationStatus: status,
                verificationMethod: method,
                verificationDate: new Date().toISOString(),
                notes: notes || doc.notes
              };
            }
            return doc;
          }),
          updatedAt: new Date().toISOString()
        };
      }
      return vehicle;
    }));

    toast.success(status === 'verified' ? "Document verified successfully" : "Document verification failed");
  };
  
  const handleVehicleUpdate = useCallback(async (payload: any) => {
    console.log("[Realtime] Vehicle event received:", payload);

    const event = payload.eventType;
    const newVehicle = payload.new;
    const oldVehicle = payload.old;
    
    // CRITICAL SECURITY FIX: Validate that the vehicle belongs to the current client
    // Even though we filter at subscription level, double-check here for safety
    const vehicleToCheck = newVehicle || oldVehicle;
    if (vehicleToCheck && vehicleToCheck.client_id && vehicleToCheck.client_id !== clientId) {
      console.warn("[Realtime] Vehicle event for different client, ignoring:", {
        vehicleClientId: vehicleToCheck.client_id,
        currentClientId: clientId,
        vehicleId: vehicleToCheck.id
      });
      return; // Ignore events for vehicles from other clients
    }
    
    if (event === "DELETE") {
      setVehicles(prev =>
        prev.filter(v => v.id !== oldVehicle.id)
      );
      return;
    }
    const vehicleId =
      newVehicle?.id ||
      oldVehicle?.id ||
      null;

    if (!vehicleId) {
      console.warn("[Realtime] No vehicle ID in payload → full refresh");
      await fetchVehicles();
      return;
    }

    try {
      const refreshed = await getVehicleById(vehicleId, clientId);

      if (!refreshed) {
        await fetchVehicles();
        return;
      }

      // Double-check that the refreshed vehicle belongs to the current client
      if (refreshed.clientId !== clientId) {
        console.warn("[Realtime] Refreshed vehicle belongs to different client, ignoring:", {
          vehicleClientId: refreshed.clientId,
          currentClientId: clientId,
          vehicleId: refreshed.id
        });
        return;
      }

      setVehicles(prev => {
        const exists = prev.some(v => v.id === refreshed.id);
        return exists
          ? prev.map(v => (v.id === refreshed.id ? refreshed : v))
          : [refreshed, ...prev];
      });

    } catch (err) {
      console.error("[Realtime] Error refreshing vehicle:", err);
      await fetchVehicles();
    }
  }, [clientId, fetchVehicles]);

  useRealTimeSubHook({
    channelName: `vehicles-${clientId}`,
    events: "*",
    table: "vehicles",
    enabled: true,
    onPayload: handleVehicleUpdate,
  });

  return (
    <TransportSafetyContext.Provider
      value={{
        vehicles,
        loading,
        hasFetched,
        error,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        getVehicle,
        addDocument,
        updateDocument,
        deleteDocument,
        verifyDocument,
        fetchVehicles
      }}
    >
      {children}
    </TransportSafetyContext.Provider>
  );
};
