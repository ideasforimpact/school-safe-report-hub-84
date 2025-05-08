
import React, { createContext, useContext, useState } from 'react';
import { TransportSafetyContextType, TransportSafetyProviderProps } from './types';
import { initialVehicles } from './initialData';
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

const TransportSafetyContext = createContext<TransportSafetyContextType | undefined>(undefined);

export const useTransportSafety = () => {
  const context = useContext(TransportSafetyContext);
  if (!context) {
    throw new Error('useTransportSafety must be used within a TransportSafetyProvider');
  }
  return context;
};

export const TransportSafetyProvider: React.FC<TransportSafetyProviderProps> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => {
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: uuidv4(),
      documents: [],
      createdAt: now,
      updatedAt: now
    };
    setVehicles([...vehicles, newVehicle]);
    toast({
      title: "Vehicle Added",
      description: `${vehicleData.make} ${vehicleData.model} (${vehicleData.registrationNumber}) has been added`
    });
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === id 
        ? { ...vehicle, ...updates, updatedAt: new Date().toISOString() } 
        : vehicle
    ));
  };

  const deleteVehicle = (id: string) => {
    const vehicleToDelete = vehicles.find(v => v.id === id);
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    
    if (vehicleToDelete) {
      toast({
        title: "Vehicle Deleted",
        description: `${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.registrationNumber}) has been deleted`
      });
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

    toast({
      title: "Document Added",
      description: `${document.type.charAt(0).toUpperCase() + document.type.slice(1)} document added successfully`
    });
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

    toast({
      title: "Document Deleted",
      description: "Document has been deleted successfully"
    });
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

    toast({
      title: status === 'verified' ? "Document Verified" : "Verification Failed",
      description: status === 'verified' 
        ? "Document has been successfully verified" 
        : "Document verification failed. Please check the document details"
    });
  };

  return (
    <TransportSafetyContext.Provider
      value={{
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        getVehicle,
        addDocument,
        updateDocument,
        deleteDocument,
        verifyDocument
      }}
    >
      {children}
    </TransportSafetyContext.Provider>
  );
};
