
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

// Type definitions (can be moved to a separate file later)
export type EmployeeVerificationContextType = {
  loading: boolean;
  employees: any[];
  documentTypes: any[];
  documentStatusList: any[];
  fetchEmployees: () => Promise<void>;
  fetchDocumentTypes: () => Promise<any[]>;
  fetchDocumentStatus: () => Promise<any[]>;
  addEmployee: (employee: any) => Promise<any>;
  updateEmployee: (employeeId: string, updatedData: any) => Promise<any>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  uploadDocument: (
    employeeId: string,
    documentTypeId: string,
    file: File,
    documentNumber?: string
  ) => Promise<any>;
  verifyDocument: (
    documentId: string,
    statusId: string,
    notes?: string
  ) => Promise<any>;
  fetchEmployeeById: (id: string) => Promise<any>;
  fetchEmployeeDocuments: (employeeId: string) => Promise<any[]>;
  deleteDocument: (documentId: string) => Promise<void>;
  refreshDocuments: (employeeId: string) => Promise<void>;
  verifyAadhar: (
    documentId: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string }>;
  requestAadharOTP: (documentId: string) => Promise<boolean>;
  documents: Record<string, any[]>;
};

// Create context
const EmployeeVerificationContext = createContext<
  EmployeeVerificationContextType | undefined
>(undefined);

// Cache for document status
let documentStatusCache: any[] = [];
let lastDocumentStatusFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const EmployeeVerificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [documentStatusList, setDocumentStatusList] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Record<string, any[]>>({});

  // Fetch employees on mount
  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchDocumentTypes();
      fetchDocumentStatus();
    }
  }, [user]);

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  // Fetch document types with caching
  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("employee_document_type")
        .select("*");

      if (error) throw error;
      setDocumentTypes(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching document types:", error);
      toast.error("Failed to fetch document types");
      return [];
    }
  };

  // Fetch document status list with caching
  const fetchDocumentStatus = async () => {
    const now = Date.now();
    
    // Use cache if available and not expired
    if (documentStatusCache.length > 0 && now - lastDocumentStatusFetch < CACHE_TTL) {
      setDocumentStatusList(documentStatusCache);
      return documentStatusCache;
    }
    
    try {
      const { data, error } = await supabase.from("document_status").select("*");

      if (error) throw error;
      
      // Update cache
      documentStatusCache = data || [];
      lastDocumentStatusFetch = now;
      
      setDocumentStatusList(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching document status:", error);
      toast.error("Failed to fetch document status");
      return [];
    }
  };

  // Add employee
  const addEmployee = async (employee: any) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      await fetchEmployees(); // Refresh employees list
      return data;
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }
  };

  // Update employee
  const updateEmployee = async (employeeId: string, updatedData: any) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .update(updatedData)
        .eq("id", employeeId)
        .select()
        .single();

      if (error) throw error;
      await fetchEmployees(); // Refresh employees list
      return data;
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
      throw error;
    }
  };

  // Delete employee
  const deleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (error) throw error;
      await fetchEmployees(); // Refresh employees list
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
      throw error;
    }
  };

  // Upload document
  const uploadDocument = async (
    employeeId: string,
    documentTypeId: string,
    file: File,
    documentNumber?: string
  ) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId);
      formData.append("documentTypeId", documentTypeId);
      if (documentNumber) {
        formData.append("documentNumber", documentNumber);
      }

      // Call the edge function to upload document
      const { data, error } = await supabase.functions.invoke(
        "employee-documents",
        {
          body: formData,
          headers: {
            "x-client-info": `supabase-js/${
              (supabase as any)._supabaseUrl as string
            }`,
          },
        }
      );

      if (error) throw error;
      
      // Refresh documents for the employee
      refreshDocuments(employeeId);
      
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
      throw error;
    }
  };

  // Verify document
  const verifyDocument = async (
    documentId: string,
    statusId: string,
    notes?: string
  ) => {
    try {
      // First get the employee ID for the document so we can refresh later
      const { data: docData } = await supabase
        .from("employee_documents")
        .select("employee_id")
        .eq("id", documentId)
        .single();
        
      // Update the document status
      const { data, error } = await supabase
        .from("employee_documents")
        .update({
          document_status_id: statusId,
          employee_docs_log: supabase.rpc("append_to_log", {
            log_array: [],
            log_entry: {
              timestamp: new Date().toISOString(),
              status_id: statusId,
              notes: notes || "",
            },
          }),
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh documents for this employee if we found the employee ID
      if (docData?.employee_id) {
        refreshDocuments(docData.employee_id);
      }
      
      return data;
    } catch (error) {
      console.error("Error verifying document:", error);
      toast.error("Failed to verify document");
      throw error;
    }
  };

  // Fetch employee by ID
  const fetchEmployeeById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee details");
      throw error;
    }
  };

  // Fetch employee documents
  const fetchEmployeeDocuments = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from("employee_documents")
        .select(`
          *,
          document_type:document_type_id(id, name),
          document_status:document_status_id(id, name)
        `)
        .eq("employee_id", employeeId);

      if (error) throw error;
      
      // Save to documents state for caching
      setDocuments(prev => ({
        ...prev,
        [employeeId]: data || []
      }));
      
      return data || [];
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      toast.error("Failed to fetch employee documents");
      return [];
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      // First get the employee ID for the document so we can refresh later
      const { data: docData } = await supabase
        .from("employee_documents")
        .select("employee_id")
        .eq("id", documentId)
        .single();
        
      // Delete the document
      const { error } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      
      // Refresh documents for this employee if we found the employee ID
      if (docData?.employee_id) {
        refreshDocuments(docData.employee_id);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
      throw error;
    }
  };

  // Refresh documents for an employee
  const refreshDocuments = async (employeeId: string) => {
    await fetchEmployeeDocuments(employeeId);
  };

  // Request Aadhar OTP
  const requestAadharOTP = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "employee-verification",
        {
          body: {
            action: "requestOTP",
            documentId,
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to request OTP");
      
      toast.success("OTP sent successfully");
      return true;
    } catch (error) {
      console.error("Error requesting Aadhar OTP:", error);
      toast.error("Failed to request OTP");
      return false;
    }
  };

  // Verify Aadhar with OTP
  const verifyAadhar = async (documentId: string, otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "employee-verification",
        {
          body: {
            action: "verifyOTP",
            documentId,
            otp,
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to verify OTP");
      
      // Get the employee ID to refresh documents
      const { data: docData } = await supabase
        .from("employee_documents")
        .select("employee_id")
        .eq("id", documentId)
        .single();
        
      // Refresh documents for this employee if we found the employee ID
      if (docData?.employee_id) {
        refreshDocuments(docData.employee_id);
      }
      
      toast.success("Document verified successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error verifying Aadhar:", error);
      toast.error(error.message || "Failed to verify OTP");
      return { success: false, error: error.message };
    }
  };

  // Context value
  const contextValue = {
    loading,
    employees,
    documentTypes,
    documentStatusList,
    documents,
    fetchEmployees,
    fetchDocumentTypes,
    fetchDocumentStatus,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    uploadDocument,
    verifyDocument,
    fetchEmployeeById,
    fetchEmployeeDocuments,
    deleteDocument,
    refreshDocuments,
    verifyAadhar,
    requestAadharOTP,
  };

  return (
    <EmployeeVerificationContext.Provider value={contextValue}>
      {children}
    </EmployeeVerificationContext.Provider>
  );
};

// Hook to use the context
export const useEmployeeVerification = () => {
  const context = useContext(EmployeeVerificationContext);
  if (!context) {
    throw new Error(
      "useEmployeeVerification must be used within an EmployeeVerificationProvider"
    );
  }
  return context;
};
