import { useState, useMemo } from 'react';
import { Client, useClient, InstitutionType, ModuleInfo } from '@/contexts/ClientContext';
import { OAuthProviderName } from '@/utils/authProviders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IPAddress } from '@/components/backoffice/tabs/IPList';

export type StatusFilter = 'active' | 'inactive' | 'all';

export interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  active: boolean;
  logo: string;
  institutionType: InstitutionType;
  allowedDomains: string[];
  superAdminEmail: string;
  website?: string;
  clientTypeId?: string;
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
  superAdminEmailExists?: boolean;
  superAdminAllowedDomains: string[];
  moduleInfoArray?: ModuleInfo[];
  whitelistedIPs?: IPAddress[];
  /** AI "Recommended Actions" for incidents; default on */
  aiIncidentRecommendedActionsEnabled: boolean;
  isHeadOffice: boolean;
  mappedClientIds: string[];
  parentHeadOfficeId?: string;
  parentHeadOfficeName?: string;
}

const initialFormData: ClientFormData = {
  id: undefined,
  name: '',
  email: '',
  contactPerson: '',
  phone: '',
  active: true,
  logo: '',
  institutionType: 'Other',
  allowedDomains: [],
  superAdminEmail: '',
  website: '',
  clientTypeId: '',
  authProviders: {
    google: false,
    microsoft: false,
    zoho: false
  },
  superAdminAllowedDomains: [],
  moduleInfoArray: [],
  whitelistedIPs: [],
  aiIncidentRecommendedActionsEnabled: true,
  isHeadOffice: false,
  mappedClientIds: [],
  parentHeadOfficeId: undefined,
  parentHeadOfficeName: undefined,
};

export const useClientManagement = () => {
  const { clients, loading, updateClient, deleteClient, fetchClients } = useClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({...initialFormData});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // Filter clients based on status
  const filteredClients = useMemo(() => {
    if (statusFilter === 'all') {
      return clients;
    }
    return clients.filter(client => 
      statusFilter === 'active' ? client.active : !client.active
    );
  }, [clients, statusFilter]);

  const resetForm = () => {
    setFormData({...initialFormData});
    setCurrentClient(null);
  };

  // Function to load modules for new client
  const loadModulesForNewClient = async () => {
    setModulesLoading(true);
    try {
      console.log("Loading modules for new client creation");
      const { data, error } = await supabase.functions.invoke('fetch-modules', {
        body: { fetchLevel: 'client' }
      });

      if (error) {
        console.error("Error fetching modules:", error);
        toast.error("Failed to load modules");
        return false;
      }

      if (data && data.modules) {
        console.log("Modules loaded successfully:", data.modules.length);
        // Enable all modules with admin access by default for new client
        const moduleInfoArray: ModuleInfo[] = data.modules.map((module: any) => ({
          name: module.name,
          module_id: module.id,
          is_admin: true
        }));

        setFormData(prev => ({
          ...prev,
          moduleInfoArray
        }));
        
        console.log("Set default modules for new client:", moduleInfoArray);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error in loadModulesForNewClient:", error);
      toast.error("Error loading modules");
      return false;
    } finally {
      setModulesLoading(false);
    }
  };

  // Open add dialog and load modules
  const handleAddDialogOpen = async () => {
    setIsAddDialogOpen(true);
    // Load modules immediately when dialog opens
    await loadModulesForNewClient();
  };

  // Check if super admin email domain is allowed
  const isSuperAdminEmailDomainAllowed = (email: string, allowedDomains: string[]): boolean => {
    if (!email || allowedDomains.length === 0) return true;
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    
    return allowedDomains.some(domain => domain.toLowerCase() === emailDomain);
  };

  const handleAddClient = async () => {
    if (formData.isHeadOffice && formData.mappedClientIds.length === 0) {
      toast.error('Please map at least one sub-client for a Head Office client');
      return;
    }

    // Prevent duplicate calls - check submission state first
    if (isSubmitting) {
      console.log('Add client submission already in progress, skipping...');
      return; 
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    // Check if super admin email domain is allowed
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }

    // Ensure we have modules data before submitting
    if (!formData.moduleInfoArray || formData.moduleInfoArray.length === 0) {
      toast.error('Modules are required for client creation. Please wait for modules to load or refresh the page.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      console.log('Module info for client creation:', moduleInfoArray);
      console.log('Logo data being sent:', {
        hasLogo: !!formData.logo,
        logoType: typeof formData.logo,
        logoLength: formData.logo ? formData.logo.length : 0,
        logoPreview: formData.logo ? formData.logo.substring(0, 50) + '...' : 'No logo'
      });
      
      // Create the request payload with ALL client data
      const requestPayload = {
        operation: 'create',
        client: {
          modules: moduleInfoArray,
          superAdminEmail: formData.superAdminEmail,
          clientTypeId: formData.clientTypeId,
          logo: formData.logo || null,
          // Include all the form data
          name: formData.name,
          email: formData.email,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          active: formData.active,
          institutionType: formData.institutionType,
          allowedDomains: formData.allowedDomains,
          superAdminAllowedDomains: formData.superAdminAllowedDomains,
          authProviders: formData.authProviders,
          website: formData.website,
          whitelistedIPs: formData.whitelistedIPs || [],
          aiFeatureIncidentRecommendedActions: formData.aiIncidentRecommendedActionsEnabled
        }
      };
      
      console.log('Full request payload being sent:', {
        operation: requestPayload.operation,
        client: {
          ...requestPayload.client,
          logo: requestPayload.client.logo ? 'Logo data present (length: ' + requestPayload.client.logo.length + ')' : 'No logo data'
        }
      });
      
      // Call the edge function - this handles everything including database insertion
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: requestPayload
      });
      
      if (error) {
        console.error('Error creating client:', error);
        toast.error('Failed to create client');
        return;
      }
      
      if (data && data.success) {
        toast.success('Client and super admin employee created successfully');
        setIsAddDialogOpen(false);
        resetForm();
        // Refresh the clients list to show the new client
        await fetchClients();
      } else {
        throw new Error('Client creation failed');
      }
    } catch (error) {
      console.error('Error in handleAddClient:', error);
      toast.error('Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (client: Client) => {
    setCurrentClient(client);
    // Open the dialog immediately and show a loading state while fetching
    setIsEditDialogOpen(true);
    setEditLoading(true);

    // Prefill basic client info so user can see something immediately
    setFormData(prev => ({
      ...prev,
      id: client.id,
      name: client.name,
      email: client.email,
      contactPerson: client.contactPerson,
      phone: client.phone,
      active: client.active,
      logo: client.logo || '',
      institutionType: (client.institutionType as InstitutionType) || 'Other',
      allowedDomains: client.allowedDomains || [],
      clientTypeId: client.clientTypeId || '',
      superAdminAllowedDomains: client.superAdminAllowedDomains || [],
      authProviders: {
        google: client.authProviders?.google ?? false,
        microsoft: client.authProviders?.microsoft ?? false,
        zoho: client.authProviders?.zoho ?? false
      },
      aiIncidentRecommendedActionsEnabled: client.incidentRecommendedActionsEnabled !== false,
      isHeadOffice: client.isHeadOffice === true,
      mappedClientIds: client.mappedClientIds || [],
      parentHeadOfficeId: undefined,
      parentHeadOfficeName: undefined,
    }));
    
    // Get the client modules and super admin employee for this client
    const fetchClientData = async (clientId: string) => {
      try {
        // Fetch latest client data from database to ensure we have the most up-to-date auth_providers
        // Use maybeSingle() instead of single() to handle cases where the client doesn't exist or RLS blocks access
      const { data: latestClientData, error: clientError } = await supabase
          .from('clients')
          .select('auth_providers, logo, client_logo, is_head_office')
          .eq('id', clientId)
          .maybeSingle();
        
        // Handle PGRST116 error (no rows returned) or other errors
        if (clientError) {
          if (clientError.code === 'PGRST116') {
            console.warn(`Client with ID ${clientId} not found or access denied`);
            return; // Exit early if client doesn't exist or access is denied
          }
          console.error('Error fetching client data:', clientError);
          return;
        }
        
        if (latestClientData) {
          // Parse auth_providers from database (could be JSON string or comma-separated)
          let parsedAuthProviders = {
            google: false,
            microsoft: false,
            zoho: false
          };
          
          if (latestClientData.auth_providers) {
            try {
              // Try parsing as JSON first (production format)
              const parsed = JSON.parse(latestClientData.auth_providers);
              if (typeof parsed === 'object' && parsed !== null) {
                parsedAuthProviders = {
                  google: parsed.google === true,
                  microsoft: parsed.microsoft === true,
                  zoho: parsed.zoho === true
                };
              }
            } catch (e) {
              // Not JSON, try comma-separated format
              const providers = latestClientData.auth_providers.split(',');
              parsedAuthProviders = {
                google: providers.includes('google'),
                microsoft: providers.includes('microsoft'),
                zoho: providers.includes('zoho')
              };
            }
          }
          
          // Build logo URL from path if needed
          const { buildClientLogoUrl } = await import('@/lib/utils');
          const logoPath = latestClientData.logo || latestClientData.client_logo;
          const logoUrl = logoPath ? buildClientLogoUrl(logoPath) : undefined;
          
          // Update formData with latest auth_providers and logo
          setFormData(prev => ({
            ...prev,
            authProviders: parsedAuthProviders,
            logo: logoUrl || prev.logo || '',
            isHeadOffice: latestClientData.is_head_office === true
          }));
        }
        
        // Fetch client modules with module names
        console.log("Fetching client modules for edit", clientId);
        const { data: clientModulesData, error: modulesError } = await supabase
          .from('client_modules')
          .select(`
            module_id,
            enabled,
            access_level,
            modules(id, name)
          `)
          .eq('client_id', clientId)
          .eq('enabled', true);
        
        if (modulesError) {
          console.error('Error fetching client modules:', modulesError);
          toast.error('Failed to load client modules data');
        }
        console.log('Client modules data:', clientModulesData);
        // Transform client modules data to moduleInfoArray
        const moduleInfoArray = clientModulesData ? clientModulesData.map((module: any) => {
          const moduleName = module.modules?.name || '';
          const accessLevel = module.access_level as Record<string, any> || {};
          const isAdmin = typeof accessLevel === 'object' && accessLevel !== null ? 
            !!accessLevel.isAdmin : false;
          
          return {
            name: moduleName,
            module_id: module.module_id || '',
            is_admin: isAdmin
          };
        }).filter((m: any) => m.module_id) : [];
        
        // Fetch super admin email
        // Use maybeSingle() to handle cases where no super admin exists
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('email')
          .eq('client_id', clientId)
          .eq('is_super_admin', true)
          .maybeSingle();
          
        if (employeeError) {
          console.error('Error fetching super admin email:', employeeError);
          toast.error('Failed to load super admin data');
        }
        
        // Fetch whitelisted IPs
        const { data: ipData, error: ipError } = await supabase
          .from('client_ip_whitelist')
          .select('ip_address, name')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        
        if (ipError) {
          console.error('Error fetching whitelisted IPs:', ipError);
          // Don't show error toast, just log it (IPs are optional)
        }
        
        // Transform IP data to IPAddress format
        const whitelistedIPs: IPAddress[] = ipData ? ipData.map((ip: any) => ({
          ip: ip.ip_address,
          name: ip.name || undefined
        })) : [];

        const { data: aiFeatureResponse, error: aiFeatureError } = await supabase.functions.invoke('client-management', {
          body: { operation: 'get-ai-feature', client: { id: clientId } },
        });

        if (aiFeatureError) {
          console.error('Error fetching ai feature via client-management:', aiFeatureError);
        }
        const aiIncidentRecommendedActionsEnabled =
          aiFeatureError || aiFeatureResponse?.enabled === undefined
            ? true
            : aiFeatureResponse.enabled !== false;
        
        const { data: mappingData, error: mappingError } = await supabase
          .from('client_mappings')
          .select('sub_client_id')
          .eq('head_office_id', clientId);

        if (mappingError) {
          console.error('Error fetching client mappings:', mappingError);
        }

        const { data: parentMapping, error: parentMappingError } = await supabase
          .from('client_mappings')
          .select('head_office_id')
          .eq('sub_client_id', clientId)
          .limit(1)
          .maybeSingle();

        if (parentMappingError) {
          console.error('Error fetching parent head-office mapping:', parentMappingError);
        }

        let parentHeadOfficeName: string | undefined;
        let parentHeadOfficeId: string | undefined;
        const isCurrentClientHeadOffice = latestClientData?.is_head_office === true;

        if (!isCurrentClientHeadOffice && parentMapping?.head_office_id) {
          parentHeadOfficeId = parentMapping.head_office_id;
          const { data: parentClient, error: parentClientError } = await supabase
            .from('clients')
            .select('name')
            .eq('id', parentMapping.head_office_id)
            .maybeSingle();

          if (parentClientError) {
            console.error('Error fetching parent head-office name:', parentClientError);
          } else {
            parentHeadOfficeName = parentClient?.name || undefined;
          }
        }
        // Update the remaining fields once data arrives
        setFormData(prev => ({
          ...prev,
          superAdminEmail: employeeData?.email || '',
          moduleInfoArray: moduleInfoArray,
          whitelistedIPs: whitelistedIPs,
          aiIncidentRecommendedActionsEnabled,
          mappedClientIds: isCurrentClientHeadOffice
            ? (mappingData || []).map((row: { sub_client_id: string }) => row.sub_client_id)
            : [],
          isHeadOffice: isCurrentClientHeadOffice,
          parentHeadOfficeId,
          parentHeadOfficeName,
        }));
      } catch (err) {
        console.error('Error in fetchClientData:', err);
        toast.error('Failed to load client data for editing');
      } finally {
        setEditLoading(false);
      }
    };
    
    fetchClientData(client.id);
  };

  const handleUpdateClient = async () => {
    if (formData.isHeadOffice && formData.mappedClientIds.length === 0) {
      toast.error('Please map at least one sub-client for a Head Office client');
      return;
    }

    // Prevent duplicate calls - check submission state first
    if (isSubmitting) {
      console.log('Update client submission already in progress, skipping...');
      return; 
    }
    
    if (!currentClient) {
      return;
    }
    
    if (!formData.superAdminEmail) {
      toast.error('Super Admin Email is required');
      return;
    }
    
    // Check if super admin email domain is allowed
    if (!isSuperAdminEmailDomainAllowed(formData.superAdminEmail, formData.superAdminAllowedDomains)) {
      toast.error('Super Admin email domain is not allowed. Please check the Super Admin Allowed Domains list.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const moduleInfoArray = formData.moduleInfoArray || [];
      
      console.log('Module info for client update:', moduleInfoArray);
      console.log('Logo data being sent for update:', {
        hasLogo: !!formData.logo,
        logoType: typeof formData.logo,
        logoLength: formData.logo ? formData.logo.length : 0,
        logoPreview: formData.logo ? formData.logo.substring(0, 50) + '...' : 'No logo'
      });
      
      // Ensure whitelistedIPs is always an array (never undefined or null)
      // Normalize the IP whitelist data to ensure it's sent exactly as typed
      const whitelistedIPs = Array.isArray(formData.whitelistedIPs) 
        ? formData.whitelistedIPs
            .filter(ip => ip && ip.ip && ip.ip.trim() !== '') // Filter out invalid entries
            .map(ip => ({
              ip: ip.ip.trim(), // Ensure IP is trimmed
              name: ip.name && ip.name.trim() !== '' ? ip.name.trim() : null // Send null for empty names (matches backend expectation)
            }))
        : [];
      
      console.log('Normalized whitelistedIPs being sent:', JSON.stringify(whitelistedIPs, null, 2));
      
      // Create the request payload with ALL client data
      const requestPayload = {
        operation: 'update',
        client: {
          id: currentClient.id,
          modules: moduleInfoArray,
          superAdminEmail: formData.superAdminEmail,
          clientTypeId: formData.clientTypeId,
          logo: formData.logo || '', // Always send logo data, even if empty string
          // Include all the form data for complete client update
          name: formData.name,
          email: formData.email,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          active: formData.active,
          institutionType: formData.institutionType,
          allowedDomains: formData.allowedDomains,
          superAdminAllowedDomains: formData.superAdminAllowedDomains,
          authProviders: formData.authProviders,
          website: formData.website,
          whitelistedIPs: whitelistedIPs, // Always send as array, never undefined
          aiFeatureIncidentRecommendedActions: formData.aiIncidentRecommendedActionsEnabled
        }
      };
      
      console.log('Full update request payload being sent:', {
        operation: requestPayload.operation,
        client: {
          ...requestPayload.client,
          logo: requestPayload.client.logo ? 'Logo data present (length: ' + requestPayload.client.logo.length + ')' : 'No logo data',
          whitelistedIPs: requestPayload.client.whitelistedIPs,
          whitelistedIPsLength: requestPayload.client.whitelistedIPs?.length || 0
        }
      });
      
      // Call the edge function with all client data - ensure single call
      const { data, error } = await supabase.functions.invoke('client-management', {
        body: requestPayload
      });
      
      if (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client via edge function');
        return;
      }
      
      if (data && data.success) {
        toast.success('Client and super admin employee updated successfully');
        setIsEditDialogOpen(false);
        resetForm();
        // Refresh the clients list to show the updated client
        await fetchClients();
      } else {
        throw new Error('Client update failed');
      }
    } catch (error) {
      console.error('Error in handleUpdateClient:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient(id);
    }
  };

  return {
    clients: filteredClients,
    loading: loading || isSubmitting,
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentClient,
    handleAddClient,
    handleEditClick,
    handleUpdateClient,
    handleDeleteClient,
    resetForm,
    isSuperAdminEmailDomainAllowed,
    handleAddDialogOpen,
    modulesLoading,
    editLoading,
    statusFilter,
    setStatusFilter
  };
};

export default useClientManagement;
