import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TransportSafetyContextType, TransportSafetyProviderProps } from './types';
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import {
  fetchVehiclesPaginated,
  getVehicleById,
  addVehicle as addVehicleService,
  updateVehicle as updateVehicleService,
  deleteVehicle as deleteVehicleService,
} from '@/services/transport-safety/vehicleService';
import { VehicleTypeOption } from '@/types/transportSafety';
import { useAuth } from '@/contexts/auth';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useLocation } from 'react-router-dom';

const PAGE_SIZE = 10;

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
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination state
  const [currentPage, setCurrentPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Server-side filter state (state for UI binding)
  const [searchQuery, setSearchQueryState] = useState('');
  const [statusFilter, setStatusFilterState] = useState('');
  const [typeFilter, setTypeFilterState] = useState('');

  // Refs always hold the LATEST filter values — no stale closure issues
  const searchRef = useRef('');
  const statusRef = useRef('');
  const typeRef = useRef('');
  const pageRef = useRef(1);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Abort controller ref — cancels previous in-flight request when a new one starts
  const abortControllerRef = useRef<AbortController | null>(null);

  const { user, employeeData } = useAuth();
  const location = useLocation();
  const isUsersRoute = location.pathname === '/users';
  const isTransportSafetyRoute = location.pathname.startsWith('/transport-safety');
  // Only the list/challans pages need the vehicle list — detail pages don't
  const isTransportListRoute =
    location.pathname === '/transport-safety' ||
    location.pathname === '/transport-safety/' ||
    location.pathname === '/transport-safety/challans';

  // Track whether user was on the transport list route on the previous render
  const prevIsTransportListRef = useRef(false);

  const clientId = employeeData?.clientId || user?.clientId;
  const clientIdRef = useRef(clientId);
  useEffect(() => { clientIdRef.current = clientId; }, [clientId]);

  const getWriteGuardMessage = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Switched client permission denied: delete')) {
      return 'Delete is not enabled for this switched client. Ask Head Office to enable delete permission.';
    }
    if (message.includes('Switched client permission denied: edit/create')) {
      return 'Edit/Create is not enabled for this switched client. Ask Head Office to enable edit permission.';
    }
    return fallback;
  };

  const isWriteGuardError = (err: unknown) =>
    err instanceof Error && err.message.includes('Switched client permission denied:');

  // Core fetch — reads from refs so it's always current, never stale
  const fetchVehicles = useCallback(async (overrides?: {
    page?: number;
    search?: string;
    status?: string;
    typeId?: string;
  }) => {
    const cid = clientIdRef.current;
    if (!cid) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const page   = overrides?.page   ?? pageRef.current;
    const search = overrides?.search !== undefined ? overrides.search : searchRef.current;
    const status = overrides?.status !== undefined ? overrides.status : statusRef.current;
    const typeId = overrides?.typeId !== undefined ? overrides.typeId : typeRef.current;

    try {
      setLoading(true);

      const result = await fetchVehiclesPaginated({
        clientId: cid,
        page,
        pageSize: PAGE_SIZE,
        search,
        status,
        typeId,
      });

      // Drop result if this request was superseded
      if (controller.signal.aborted) return;

      setVehicles(result.vehicles);
      if (result.vehicleTypes.length > 0) setVehicleTypes(result.vehicleTypes);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setCurrentPageState(result.page);
      pageRef.current = result.page;
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return; // silently drop aborted request errors
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles. Please try again later.');
      toast.error('Failed to load vehicles');
    } finally {
      if (!controller.signal.aborted) {
        setHasFetched(true);
        setLoading(false);
      }
    }
  }, []); // no deps — reads everything from refs

  // Fetch on mount, clientId change, or when user navigates INTO the transport safety module
  useEffect(() => {
    if (isUsersRoute) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    if (!clientId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    // Only read/write prevIsTransportListRef once clientId is confirmed — otherwise a
    // hard reload sets the ref to `true` on the first (clientId=undefined) run and the
    // second run (clientId available) sees wasOnTransport=true and skips the fetch.
    const wasOnTransport = prevIsTransportListRef.current;
    prevIsTransportListRef.current = isTransportListRoute;

    const enteringModule = isTransportListRoute && !wasOnTransport;
    if (enteringModule) {
      fetchVehicles();
    }

    return () => {
      abortControllerRef.current?.abort();
      // Reset so that StrictMode's second run (and real re-mounts) also trigger a fetch
      prevIsTransportListRef.current = false;
    };
  }, [clientId, isUsersRoute, isTransportListRoute]);

  // ── Pagination ────────────────────────────────────────────────────────────

  const setCurrentPage = useCallback((page: number) => {
    pageRef.current = page;
    setCurrentPageState(page);
    fetchVehicles({ page });
  }, [fetchVehicles]);

  // ── Search (debounced — searches entire dataset server-side) ──────────────

  const setSearchQuery = useCallback((q: string) => {
    searchRef.current = q;
    setSearchQueryState(q);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      pageRef.current = 1;
      setCurrentPageState(1);
      fetchVehicles({ page: 1, search: q });
    }, 350);
  }, [fetchVehicles]);

  // ── Status filter ─────────────────────────────────────────────────────────

  const setStatusFilter = useCallback((s: string) => {
    statusRef.current = s;
    setStatusFilterState(s);
    pageRef.current = 1;
    setCurrentPageState(1);
    fetchVehicles({ page: 1, status: s });
  }, [fetchVehicles]);

  // ── Type filter ───────────────────────────────────────────────────────────

  const setTypeFilter = useCallback((t: string) => {
    typeRef.current = t;
    setTypeFilterState(t);
    pageRef.current = 1;
    setCurrentPageState(1);
    fetchVehicles({ page: 1, typeId: t });
  }, [fetchVehicles]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => {
    try {
      if (!clientId) { toast.error('No client context available'); return; }
      const newVehicle = await addVehicleService({ ...vehicleData, clientId });
      if (newVehicle) {
        // Reset to page 1 so the new vehicle is visible
        pageRef.current = 1;
        setCurrentPageState(1);
        await fetchVehicles({ page: 1 });
        toast.success(`${vehicleData.make} ${vehicleData.model} (${vehicleData.registrationNumber}) has been added`);
      }
    } catch (err) {
      if (!isWriteGuardError(err)) console.error('Failed to add vehicle:', err);
      toast.error(getWriteGuardMessage(err, 'Failed to add vehicle. Please try again.'));
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const updatedVehicle = await updateVehicleService(id, updates);
      if (updatedVehicle) {
        setVehicles(prev => prev.map(v => (v.id === id ? updatedVehicle : v)));
        toast.success('Vehicle updated successfully');
      }
    } catch (err) {
      if (!isWriteGuardError(err)) console.error('Failed to update vehicle:', err);
      toast.error(getWriteGuardMessage(err, 'Failed to update vehicle. Please try again.'));
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const vehicleToDelete = vehicles.find(v => v.id === id);
      const success = await deleteVehicleService(id);
      if (success) {
        setVehicles(prev => prev.filter(v => v.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
        if (vehicleToDelete) {
          toast.success(`${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.registrationNumber}) has been deleted`);
        }
      }
    } catch (err) {
      if (!isWriteGuardError(err)) console.error('Failed to delete vehicle:', err);
      toast.error(getWriteGuardMessage(err, 'Failed to delete vehicle. Please try again.'));
    }
  };

  const getVehicle = useCallback((id: string) => vehicles.find(v => v.id === id), [vehicles]);

  const addDocument = (vehicleId: string, document: Omit<VehicleDocument, 'id'>) => {
    const newDocument: VehicleDocument = { ...document, id: uuidv4() };
    setVehicles(prev =>
      prev.map(vehicle =>
        vehicle.id === vehicleId
          ? { ...vehicle, documents: [...vehicle.documents, newDocument], updatedAt: new Date().toISOString() }
          : vehicle,
      ),
    );
    toast.success(`${document.type.charAt(0).toUpperCase() + document.type.slice(1)} document added successfully`);
  };

  const updateDocument = (vehicleId: string, documentId: string, updates: Partial<VehicleDocument>) => {
    setVehicles(prev =>
      prev.map(vehicle =>
        vehicle.id === vehicleId
          ? {
              ...vehicle,
              documents: vehicle.documents.map(doc => (doc.id === documentId ? { ...doc, ...updates } : doc)),
              updatedAt: new Date().toISOString(),
            }
          : vehicle,
      ),
    );
    toast.success(
      `${updates.type ? updates.type.charAt(0).toUpperCase() + updates.type.slice(1) : 'Document'} has been updated successfully`,
    );
  };

  const deleteDocument = (vehicleId: string, documentId: string) => {
    setVehicles(prev =>
      prev.map(vehicle =>
        vehicle.id === vehicleId
          ? { ...vehicle, documents: vehicle.documents.filter(doc => doc.id !== documentId), updatedAt: new Date().toISOString() }
          : vehicle,
      ),
    );
    toast.success('Document has been deleted successfully');
  };

  const verifyDocument = (
    vehicleId: string,
    documentId: string,
    status: 'verified' | 'failed',
    method: 'api' | 'manual',
    notes?: string,
  ) => {
    setVehicles(prev =>
      prev.map(vehicle =>
        vehicle.id === vehicleId
          ? {
              ...vehicle,
              documents: vehicle.documents.map(doc =>
                doc.id === documentId
                  ? { ...doc, verificationStatus: status, verificationMethod: method, verificationDate: new Date().toISOString(), notes: notes || doc.notes }
                  : doc,
              ),
              updatedAt: new Date().toISOString(),
            }
          : vehicle,
      ),
    );
    toast.success(status === 'verified' ? 'Document verified successfully' : 'Document verification failed');
  };

  const handleVehicleUpdate = useCallback(
    async (payload: any) => {
      const event = payload.eventType;
      const newVehicle = payload.new;
      const oldVehicle = payload.old;

      const vehicleToCheck = newVehicle || oldVehicle;
      if (vehicleToCheck?.client_id && vehicleToCheck.client_id !== clientIdRef.current) return;

      if (event === 'DELETE') {
        setVehicles(prev => prev.filter(v => v.id !== oldVehicle.id));
        return;
      }

      const vehicleId = newVehicle?.id || oldVehicle?.id || null;
      if (!vehicleId) { await fetchVehicles(); return; }

      try {
        const refreshed = await getVehicleById(vehicleId, clientIdRef.current);
        if (!refreshed) { await fetchVehicles(); return; }
        if (refreshed.clientId !== clientIdRef.current) return;

        setVehicles(prev => {
          const exists = prev.some(v => v.id === refreshed.id);
          return exists ? prev.map(v => (v.id === refreshed.id ? refreshed : v)) : [refreshed, ...prev];
        });
      } catch {
        await fetchVehicles();
      }
    },
    [fetchVehicles],
  );

  useRealTimeSubHook({
    channelName: `vehicles-${clientId}`,
    events: '*',
    table: 'vehicles',
    enabled: true,
    onPayload: handleVehicleUpdate,
  });

  return (
    <TransportSafetyContext.Provider
      value={{
        vehicles,
        vehicleTypes,
        loading,
        hasFetched,
        error,
        currentPage,
        totalPages,
        totalCount,
        pageSize: PAGE_SIZE,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        getVehicle,
        addDocument,
        updateDocument,
        deleteDocument,
        verifyDocument,
        fetchVehicles,
      }}
    >
      {children}
    </TransportSafetyContext.Provider>
  );
};
