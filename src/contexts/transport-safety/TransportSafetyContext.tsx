import React, { createContext, useContext, useState, useEffect } from 'react';
import { TransportSafetyContextType, TransportSafetyProviderProps } from './types';
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { 
  getAllVehicles, 
  getVehicleById, 
  addVehicle as addVehicleService, 
  updateVehicle as updateVehicleService, 
  deleteVehicle as deleteVehicleService 
} from '@/services/transport-safety/vehicleService';
import { useAuth } from '@/contexts/auth';

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
  const [error, setError] = useState<string | null>(null);
  const { user, employeeData } = useAuth();

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
      const vehiclesData = await getAllVehicles(clientId);
      
      console.log('Fetched vehicles:', vehiclesData);
      setVehicles(vehiclesData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles. Please try again later.');
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles on component mount and when client changes
  useEffect(() => {
    if (clientId) {
      fetchVehicles();
    } else {
      setVehicles([]);
      setLoading(false);
    }
  }, [clientId]);

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

  return (
    <TransportSafetyContext.Provider
      value={{
        vehicles,
        loading,
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
