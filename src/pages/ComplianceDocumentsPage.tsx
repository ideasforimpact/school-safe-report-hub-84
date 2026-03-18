import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Folder, File, ArrowLeft, Loader2, MoreVertical, Download, Trash2, Home, ChevronRight, AlertCircle, CalendarIcon ,CheckCircle, XCircle, Search, Filter, ShieldCheck, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  createPrimaryFolder,
  createSubfolder,
  listComplianceObjects,
  enqueueUploadMetadata,
  type ComplianceUploadFile,
  updateComplianceValidity,
} from '@/services/compliance/complianceService';
import { Calendar } from "@/components/ui/calendar";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteFolder, deleteFileViaEdge } from '@/services/compliance/complianceService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import Loader from '@/components/common/Loader';
const ComplianceDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const clientId = (user as any)?.client_id || (user as any)?.clientId || '';
  const { getEmployeeId } = useEmployeeAccess();
  const employeeId = getEmployeeId();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [allFiles, setAllFiles] = useState<{
    path: string;
    rowId: string;
    is_valid?: boolean;
    valid_date?: Date | null;
    fileName: string;
    folderPath: string;        
    fullPath: string;           
    parentFolderId?: string | null;       
    parentFolderFolderId?: string | null;
    parentFolderName?: string | null;      
  }[]>([]);

  const [allFolders, setAllFolders] = useState<{
    id: string;
    name: string;
    folder_id: string;
    parent_folder_id: string | null;
    fullPath: string;
  }[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string; folder_id: string }[]>([]);
  const [rootFiles, setRootFiles] = useState<{ path: string; rowId: string;is_valid?: boolean;valid_date?: Date | null;}[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [currentFolderFiles, setCurrentFolderFiles] = useState<{ path: string; rowId: string;is_valid?: boolean;valid_date?: Date }[]>([]);
  const [childFolders, setChildFolders] = useState<{ id: string; name: string; folder_id: string }[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ rowId: string; name: string; folderId: string }[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [validityDialogOpen, setValidityDialogOpen] = useState(false);
  const [validityMode, setValidityMode] = useState<"none" | "date">("none");
  const [validityDate, setValidityDate] = useState<Date | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    folder_id: string;
    name: string;
  } | null>(null);

  // Active filter count
  const activeFilterCount = [
    searchTerm?.trim() ? 'search' : '',
    statusFilter !== 'all' ? 'status' : '',
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
   const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };
  const handleSetValidityClick = (item: any) => {
  setSelectedFile(item);

  if (item.is_valid && item.valid_date) {
    setValidityMode("date");

    const existingDate =
      item.valid_date instanceof Date
        ? item.valid_date
        : new Date(item.valid_date);

    setValidityDate(existingDate);
  } else {
    setValidityMode("none");
    setValidityDate(undefined);
  }

  setValidityDialogOpen(true);
};

  
  const handleSaveValidity = async () => {
    if (!selectedFile) return;
    if (!clientId || !employeeId) return;

    const isValid = validityMode === "date";
   const validDateStr =
    isValid && validityDate
      ? [
          validityDate.getFullYear(),
          String(validityDate.getMonth() + 1).padStart(2, "0"),
          String(validityDate.getDate()).padStart(2, "0"),
        ].join("-") 
      : null;

    try {
      await updateComplianceValidity({
        rowId: selectedFile.rowId,  
        clientId,
        employeeId,
        isValid,
        validDate: validDateStr,
      });

      toast({
        title: "Validity saved",
        description: isValid
          ? `This document is valid until ${validDateStr}.`
          : "This document is set to have no expiry.",
      });

      setValidityDialogOpen(false);
      await refresh();
    } catch (err: any) {
      toast({
        title: "Failed to save validity",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getValidityStatus = (isValid?: boolean, validDate?: Date | null) => {
    if (!isValid || !validDate) return "no-validity"; 

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const fileDate = new Date(validDate);
    const fileDateStart = new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate()).getTime();

    const diffDays = Math.ceil((fileDateStart - todayStart) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "expired";           
    if (diffDays <= 30) return "warning";          
    return "valid";                                
  };

  const getFileNameFromPath = (path: string) => {
    const parts = (path || "").split("/");
    return parts[parts.length - 1] || "file";
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchesStatusFilter = (isValid?: boolean, validDate?: Date | null) => {
    const status = getValidityStatus(isValid, validDate); 

    if (statusFilter === "all") return true;

    if (statusFilter === "valid") {
      return status === "valid" || status === "no-validity";
    }
    if (statusFilter === "warning") {
      return status === "warning";
    }
    if (statusFilter === "expired") {
      return status === "expired";
    }
    return true;
  };

 const filterFileList = <T extends { path: string; is_valid?: boolean; valid_date?: any }>(
    files: T[]
  ): T[] => {
    return files.filter((it) =>
      matchesStatusFilter(it.is_valid, it.valid_date as Date | null)
    );
  };

  const filterFolderList = <T extends { name: string }>(list: T[]): T[] => list;

  const folderHasMatchingFiles = React.useMemo(() => {
    if (statusFilter === 'all') return null;

    const matchingFiles = filterFileList(allFiles);
      if (matchingFiles.length === 0) return {};

      const map: Record<string, boolean> = {};

      const findFolderById = (id: string) =>
        allFolders.find((f) => f.id === id);

      matchingFiles.forEach((file: any) => {
        let folderRowId: string | null | undefined = file.parentFolderId;

        while (folderRowId) {
          if (map[folderRowId]) break;
          map[folderRowId] = true;

          const parentFolder = findFolderById(folderRowId);
          folderRowId = parentFolder?.parent_folder_id ?? null;
        }
      });

      return map;
    }, [allFiles, allFolders, statusFilter]);


    let visibleRootFolders = !currentFolderId ? filterFolderList(folders) : folders;
    
    if (!currentFolderId && folderHasMatchingFiles && statusFilter !== 'all') {
      visibleRootFolders = visibleRootFolders.filter((f: any) =>
        folderHasMatchingFiles[f.id]
      );
    }
    const visibleRootFiles = !currentFolderId ? filterFileList(rootFiles): rootFiles;
    let visibleChildFolders = currentFolderId ? filterFolderList(childFolders) : childFolders;
    if (currentFolderId && folderHasMatchingFiles && statusFilter !== 'all') {
      visibleChildFolders = visibleChildFolders.filter((f: any) =>
        folderHasMatchingFiles[f.id]
      );
    }
  const visibleCurrentFolderFiles = currentFolderId ? filterFileList(currentFolderFiles as any) : currentFolderFiles;
  const noResults =
      (!currentFolderId &&
        visibleRootFolders.length === 0 &&
        visibleRootFiles.length === 0 &&
        statusFilter !== 'all') ||
      (currentFolderId &&
        visibleChildFolders.length === 0 &&
        visibleCurrentFolderFiles.length === 0 &&
        statusFilter !== 'all');

    const searchResults = React.useMemo(() => {
      if (!normalizedSearch) return [];

      const term = normalizedSearch;

      const folderResults = allFolders
        .filter((f) => {
          const name = (f.name || '').toLowerCase();
          return name.includes(term);
        })
        .slice(0, 5)
        .map((f) => ({
          type: 'folder' as const,
          id: f.id,
          name: f.name,
          folderId: f.folder_id,
          folderName: f.name,
          fullPath: f.fullPath || f.name,
        }));

      const fileResults = allFiles
        .filter((f: any) => {
          const name = (f.fileName || getFileNameFromPath(f.path)).toLowerCase();
          const matchesText = name.includes(term); 
          const matchesStatus = matchesStatusFilter(
            f.is_valid,
            f.valid_date as Date | null
          );
          return matchesText && matchesStatus;
        })
        .slice(0, Math.max(10 - folderResults.length, 0))
        .map((f: any, idx: number) => ({
          type: 'file' as const,
          id: `${f.rowId}-${idx}`,
          name: f.fileName || getFileNameFromPath(f.path),
          path: f.path,
          fullPath: f.fullPath || f.path,
          folderId: f.parentFolderFolderId || null,
          folderName: f.parentFolderName || null,
        }));

      const results = [...folderResults, ...fileResults];

    if (results.length === 0) {
      return [
        {
          type: 'empty' as const,
          id: 'no-results',
          message: 'No documents match the current search and validity filter.',
        },
      ];
    }

    return results;
  }, [normalizedSearch, allFolders, allFiles, statusFilter]);

    const showSearchDropdown = !!normalizedSearch && searchResults.length > 0;

  const formatDisplayDate = (date?: Date) => {
    if (!date) return "";
    const month = date.toLocaleString("en-US", { month: "long" }); 
    const day = String(date.getDate()).padStart(2, "0");          
    const year = date.getFullYear();                               
    return `${month}-${day}-${year}`;
  };

  const bucketName = 'compliance_documents';
  const storageBaseUrl = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL as string | undefined;

  // Aggregate progress for the overlay widget
  const totalProgress = React.useMemo(() => {
    if (!uploading || uploadItems.length === 0) return 0;
    const sum = uploadItems.reduce((acc, it) => acc + (isFinite(it.progress) ? it.progress : 0), 0);
    return Math.floor(sum / uploadItems.length);
  }, [uploading, uploadItems]);

  const refresh = async () => {
    if (!clientId || !employeeId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('compliance_documents')
      .select('id, folder_exists, folder_id, parent_folder_id, files,is_valid,valid_date')
      .eq('client_id', clientId)
      .eq('created_by', employeeId)
      .eq('is_delete', 0); // Only fetch non-deleted records
    if (error) throw error;
      
    const folderRowsAll = (data || []).filter(
      (r: any) => r.folder_exists === true
    );

    const folderRowById: Record<string, any> = {};
    folderRowsAll.forEach((r: any) => {
      folderRowById[r.id] = r;
    });

    const buildFolderPath = (row: any): string => {
      const segments: string[] = [];
      let current: any = row;
      while (current) {
        const nm: string =
          current.files?.[0]?.folder_name ||
          (() => {
            const fp: string | undefined = current.files?.[0]?.path;
            const parts = (fp || '').split('/');
            return parts.length >= 2 ? parts[1] : 'Folder';
          })();

        segments.unshift(nm);
        if (!current.parent_folder_id) break;
        current = folderRowById[current.parent_folder_id];
        if (!current) break;
      }
      return segments.join(' / ');
    };

    const allFolderList = folderRowsAll.map((r: any) => {
      const structuredName: string | undefined = r.files?.[0]?.folder_name;
      const firstPath: string | undefined = r.files?.[0]?.path;
      const parts = (firstPath || '').split('/');
      const fallbackName = parts.length >= 2 ? parts[1] : 'Folder';

      const name = structuredName || fallbackName;
      const folderPath = buildFolderPath(r); 
      const fullPath = folderPath ? `Root / ${folderPath}` : 'Home';

      return {
        id: r.id as string,
        name,
        folder_id: r.folder_id as string,
        parent_folder_id: (r.parent_folder_id ?? null) as string | null,
        fullPath,
      };
    });

    setAllFolders(allFolderList);

    const allFileRows = (data || []).filter(
      (r: any) => r.folder_exists === false
    );

    const allFilesFlattened = allFileRows.flatMap((r: any) => {
      const parentFolder = r.parent_folder_id
        ? folderRowById[r.parent_folder_id]
        : null;
      const folderPath = parentFolder ? buildFolderPath(parentFolder) : '';
      return (r.files || [])
        .filter(
          (f: any) =>
            !f.is_delete || f.is_delete === 0 || f.is_delete === false
        ).map((f: any) => {
          const fileName =
            (f.path || '').split('/').pop() || f.fileName || 'file';
          const fullPath = folderPath
            ? `Root / ${folderPath} / ${fileName}`
            : `Root / ${fileName}`;

          const parentFolderName = parentFolder
            ? parentFolder.files?.[0]?.folder_name ||
              (() => {
                const fp: string | undefined = parentFolder.files?.[0]?.path;
                const parts = (fp || '').split('/');
                return parts.length >= 2 ? parts[1] : 'Folder';
              })()
            : null;

          return {
            ...f,
            rowId: r.id,
            is_valid: r.is_valid,
            valid_date: r.valid_date,
            fileName,
            folderPath,
            fullPath,
            parentFolderId: parentFolder ? String(parentFolder.id) : null,
            parentFolderFolderId: parentFolder ? (parentFolder.folder_id as string) : null,
            parentFolderName,
          };
        });
    });

    setAllFiles(allFilesFlattened);

    if (!currentFolderId) {
      // Root view:
      // - Folders: rows with folder_exists = true and no parent_folder_id
      // - Files: rows with folder_exists = false and no parent_folder_id
      const folderRows = (data || []).filter(
        (r: any) =>
          r.folder_exists === true &&
          (r.parent_folder_id === null || typeof r.parent_folder_id === 'undefined')
      );

      const fileRows = (data || []).filter(
        (r: any) =>
          r.folder_exists === false &&
          (r.parent_folder_id === null || typeof r.parent_folder_id === 'undefined')
      );

      const folderList = folderRows.map((r: any) => {
        // Prefer structured folder_name if present
        const structuredName: string | undefined = r.files?.[0]?.folder_name;
        if (structuredName) {
          return { id: r.id as string, name: structuredName, folder_id: r.folder_id as string };
        }
        const firstPath: string | undefined = r.files?.[0]?.path;
        const parts = (firstPath || '').split('/');
        const name = parts.length >= 2 ? parts[1] : 'Folder';
        return { id: r.id as string, name, folder_id: r.folder_id as string };
      });

      // Each non-folder row represents one or more files at root.
      // For new data there should be exactly one file per row, but we
      // still flatten for backward compatibility.
      const files = fileRows.flatMap((r: any) =>
        (r.files || [])
          .filter((f: any) => !f.is_delete || f.is_delete === 0 || f.is_delete === false)
          .map((f: any) => ({ ...f, rowId: r.id,is_valid:r.is_valid ,valid_date:r.valid_date}))
      );

      setFolders(folderList);
      setRootFiles(files);
      setCurrentFolderFiles([]);
      setChildFolders([]);
      setBreadcrumb([]);
    } else {
      // Inside a folder:
      // - current folder row is identified by folder_id
      // - child folders: folder_exists = true and parent_folder_id = current folder row id
      // - files: folder_exists = false and parent_folder_id = current folder row id
      const folderRow = (data || []).find((r: any) => r.folder_id === currentFolderId);

      if (folderRow) {
        const fileRows = (data || []).filter(
          (r: any) => r.folder_exists === false && r.parent_folder_id === folderRow.id
        );

        const files = fileRows.flatMap((r: any) =>
          (r.files || [])
            .filter((f: any) => !f.is_delete || f.is_delete === 0 || f.is_delete === false)
            .map((f: any) => ({ ...f, rowId: r.id,is_valid:r.is_valid ,valid_date:r.valid_date}))
        );
        setCurrentFolderFiles(files);

        const children = (data || [])
          .filter((r: any) => r.parent_folder_id === folderRow.id && r.folder_exists === true)
          .map((r: any) => ({
            id: r.id as string,
            name: r.files?.[0]?.folder_name || 'Folder',
            folder_id: r.folder_id as string,
          }));
        setChildFolders(children);

        // Build breadcrumb path from this row up to root using in-memory data
        const path: { rowId: string; name: string; folderId: string }[] = [];
        let walker: any = folderRow;
        while (walker) {
          path.unshift({
            rowId: walker.id,
            name: walker.files?.[0]?.folder_name || 'Folder',
            folderId: walker.folder_id as string,
          });
          if (!walker.parent_folder_id) break;
          walker = (data || []).find((r: any) => r.id === walker.parent_folder_id);
          if (!walker) break;
        }
        setBreadcrumb(path);
      } else {
        // If folder row missing (should not happen), reset to root.
        setCurrentFolderId(null);
        setCurrentFolderName(null);
        setChildFolders([]);
        setCurrentFolderFiles([]);
        setBreadcrumb([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [clientId, employeeId, currentFolderId]);

  // Build a flat list of all files for export (independent of current folder view)
  const fetchAllFilesForExport = async () => {
    if (!clientId || !employeeId) return [];

    const { data, error } = await (supabase as any)
      .from('compliance_documents')
      .select('id, folder_exists, files, is_valid, valid_date, is_delete, parent_folder_id')
      .eq('client_id', clientId)
      .eq('created_by', employeeId)
      .eq('is_delete', 0);

    if (error) throw error;

    const rows: any[] = data || [];

    // Map of folder row id -> folder row for building full folder chain
    const folderMap = new Map<string, any>();
    rows
      .filter((r: any) => r.folder_exists === true)
      .forEach((r: any) => {
        folderMap.set(r.id as string, r);
      });

    // Helper to compute full folder path (Folder1/Folder2/...)
    const buildFolderPath = (row: any): string => {
      const segments: string[] = [];
      let parentId: string | null | undefined = row.parent_folder_id;

      while (parentId) {
        const parent = folderMap.get(parentId);
        if (!parent) break;

        // Derive folder name similar to UI logic
        let folderName: string | undefined = parent.files?.[0]?.folder_name;
        if (!folderName) {
          const firstPath: string | undefined = parent.files?.[0]?.path;
          if (firstPath) {
            const parts = firstPath.split('/');
            // second segment is usually folder name after clientId
            folderName = parts.length >= 2 ? parts[1] : 'Folder';
          }
        }
        folderName = folderName || 'Folder';

        // Remove any trailing "_<id>" from folderName
        const underscoreIdx = folderName.lastIndexOf('_');
        if (underscoreIdx > 0) {
          folderName = folderName.slice(0, underscoreIdx);
        }

        segments.unshift(folderName);
        parentId = parent.parent_folder_id;
      }

      return segments.join('/');
    };

    const fileRecords =
      rows
        .filter((r: any) => r.folder_exists === false)
        .flatMap((r: any) => {
          const baseFolderPath = buildFolderPath(r);

          return (r.files || [])
            .filter((f: any) => !f.is_delete || f.is_delete === 0 || f.is_delete === false)
            .map((f: any) => {
              const fullStoragePath: string = f.path as string;
              const parts = (fullStoragePath || '').split('/');
              const fileName = parts[parts.length - 1] || '';

              const displayPath = baseFolderPath
                ? `${baseFolderPath}/${fileName}`
                : fileName;

              return {
                path: fullStoragePath,
                displayPath,
                is_valid: r.is_valid as boolean | null | undefined,
                valid_date: r.valid_date as string | null,
              };
            });
        });

    return fileRecords;
  };

  const handleExportFiles = async () => {
    try {
      setExporting(true);

      const allFiles = await fetchAllFilesForExport();

      if (allFiles.length === 0) {
        toast({
          title: 'No files to export',
          description: 'There are no compliance documents available for export.',
        });
        return;
      }

      // Separate files by validity flag
      const withValidity = allFiles.filter(
        (f: any) => f.is_valid && f.valid_date
      );
      const withoutValidity = allFiles.filter(
        (f: any) => !f.is_valid || !f.valid_date
      );

      // Sort files with validity by ascending validity date
      withValidity.sort((a: any, b: any) => {
        const da = a.valid_date ? new Date(a.valid_date).getTime() : 0;
        const db = b.valid_date ? new Date(b.valid_date).getTime() : 0;
        return da - db;
      });

      const orderedFiles = [...withValidity, ...withoutValidity];

      const exportRows = orderedFiles.map((file: any) => {
        // displayPath already contains Folder1/Folder2/FileName with cleaned folder names
        const fullDisplayPath: string = file.displayPath || '';

        const rawIsValid: boolean | null | undefined = file.is_valid;
        const rawDate: Date | null = file.valid_date ? new Date(file.valid_date) : null;

        // Validity Flag: Yes if explicit validity with date; No otherwise
        const validityFlag = rawIsValid && rawDate ? 'Yes' : 'No';

        // Validity Date: only when explicit validity is set
        const validityDateStr =
          rawIsValid && rawDate
            ? rawDate.toISOString().split('T')[0]
            : '';

        // Validity Status rules:
        // - is_valid is false or null => "Valid" (no explicit expiry, considered valid)
        // - is_valid true with date:
        //     * > 30 days remaining -> "Valid"
        //     * 1..30 days remaining -> "Nearing Invalid"
        //     * <= 0 days remaining -> "Invalid"
        let validityStatus = '';
        if (!rawIsValid || !rawDate) {
          validityStatus = 'Valid';
        } else {
          const today = new Date();
          const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          ).getTime();

          const fileDateStart = new Date(
            rawDate.getFullYear(),
            rawDate.getMonth(),
            rawDate.getDate()
          ).getTime();

          const diffDays = Math.ceil((fileDateStart - todayStart) / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            validityStatus = 'Invalid';
          } else if (diffDays <= 30) {
            validityStatus = 'Nearing Invalid';
          } else {
            validityStatus = 'Valid';
          }
        }

        return {
          'File name (full directory path)': fullDisplayPath,
          'Validity Flag': validityFlag,
          'Validity Date': validityDateStr,
          'Validity Status': validityStatus,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ComplianceDocuments');

      const todayStr = new Date().toISOString().split('T')[0];
      const fileName = `Compliance_Documents_Export_${todayStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Export started',
        description: 'Your compliance documents have been exported successfully.',
      });
    } catch (error: any) {
      console.error('Error exporting compliance documents:', error);
      toast({
        title: 'Export failed',
        description: error?.message || 'Unable to export compliance documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Realtime sync: refresh UI when metadata worker updates the table
  useEffect(() => {
    if (!clientId || !employeeId) return;
    const channel = (supabase as any)
      .channel(`compliance-docs-${clientId}-${employeeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'compliance_documents', filter: `client_id=eq.${clientId}` },
        (payload: any) => {
          const createdBy = (payload?.new?.created_by ?? payload?.old?.created_by) as string | null | undefined;
          if (!createdBy || createdBy === employeeId) {
            // Avoid thrashing: debounce a bit
            clearTimeout((window as any).__cdocs_rtimer);
            (window as any).__cdocs_rtimer = setTimeout(() => {
              refresh();
            }, 150);
          }
        }
      )
      .subscribe();

    return () => {
      try { (supabase as any).removeChannel(channel); } catch (_) { /* noop */ }
    };
  }, [clientId, employeeId]);

  const onChooseFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !clientId) return;

    // Clear any previous error messages
    setUploadError(null);

    // Validation: limit total files per upload
    if (files.length > 25) {
      toast({ title: 'Too many files', description: 'You can upload a maximum of 25 files at a time.' });
      (e.target as HTMLInputElement).value = '';
      return;
    }

    // Validation: images up to 5 MB
    const oversizeImage = files.find(f => (f.type || '').startsWith('image/') && f.size > 5 * 1024 * 1024);
    if (oversizeImage) {
      toast({
        title: 'Image too large',
        description: `${oversizeImage.name} exceeds 5 MB. Please choose a smaller image.`,
      });
      (e.target as HTMLInputElement).value = '';
      return;
    }
    setUploading(true);
    // optimistic list for progress
    setUploadItems(files.map((f) => ({ id: `${Date.now()}-${f.name}`, name: f.name, progress: 0, status: 'uploading' })));

    const safeFolderName = (currentFolderName || 'Folder').split('/').join('-');
    const baseFolderSlug = currentFolderId && currentFolderName
      ? `${clientId}/${safeFolderName}_${currentFolderId}`
      : `${clientId}/general`;

    const uploadOne = async (file: File, idx: number) => {
      const objectPath = `${baseFolderSlug}/${file.name}`;
      // Create signed upload URL
      const signed = await supabase.storage.from(bucketName).createSignedUploadUrl(objectPath);
      if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || 'Failed to create signed upload URL');

      await xhrPut(signed.data.signedUrl, file, (pct) => {
        setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: pct } : it));
      });

      // Asynchronously enqueue metadata persistence
      try {
        await enqueueUploadMetadata({
          clientId,
          employeeId,
          parentFolderId: currentFolderId,
          folderName: currentFolderName?? '',
          objectPath,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        });
      } catch (_) {
        // Non-blocking: metadata worker failure should not fail the upload UX
      }

      setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: 100, status: 'done' } : it));
      return objectPath;
    };

    try {
      const results = await Promise.allSettled(files.map((f, idx) => uploadOne(f, idx)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results
        .map((r, i) => ({ r, i }))
        .filter((x) => x.r.status === 'rejected');
      if (failures.length > 0) {
        const errorMessages: string[] = [];
        failures.forEach(({ i, r }) => {
          const errorMsg = (r as PromiseRejectedResult).reason?.message || 'Upload failed';
          setUploadItems((prev) => prev.map((it, idx2) => idx2 === i ? { ...it, status: 'error', error: errorMsg } : it));
          // Collect unique error messages
          if (errorMsg && !errorMessages.includes(errorMsg)) {
            errorMessages.push(errorMsg);
          }
        });
        // Show specific error message if available, otherwise generic message
        const errorDisplay = errorMessages.length > 0 
          ? errorMessages[0] // Show first error message
          : `${failures.length} file(s) failed to upload`;
        setUploadError(errorDisplay);
        toast({ 
          title: 'Some uploads failed', 
          description: errorDisplay,
          variant: 'destructive'
        });
      } else {
        setUploadError(null);
      }
      if (successCount > 0) {
        toast({ title: 'Upload complete', description: `${successCount} file(s) uploaded successfully` });
      }
      await refresh();
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      setUploadError(errorMsg);
      toast({ 
        title: 'Upload failed', 
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
      // Clear progress list after a short delay
      setTimeout(() => setUploadItems([]), 1500);
      // Clear error message after a delay
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const createFolder = async () => {
    if (!folderName.trim() || !clientId) return;
    
    // Clear previous error
    setFolderError(null);
    
    // Check for duplicate folder name
    const trimmedName = folderName.trim();
    const existingFolders = currentFolderId ? childFolders : folders;
    const duplicateFolder = existingFolders.find(
      (f) => f.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (duplicateFolder) {
      const errorMsg = `A folder named "${trimmedName}" already exists. Please choose a different name.`;
      setFolderError(errorMsg);
      toast({
        title: 'Duplicate folder name',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }
    
    setCreatingFolder(true);
    try {
      await createPrimaryFolder(clientId, trimmedName, employeeId, currentFolderId);
      setNewFolderOpen(false);
      setFolderName('');
      setFolderError(null);
      await refresh();
    } catch (error: any) {
      const errorMsg = error?.message || 'An error occurred while creating the folder.';
      setFolderError(errorMsg);
      toast({
        title: 'Failed to create folder',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleViewFile = async (path: string) => {
    // Create a signed URL for viewing (without download parameter)
    let viewUrl: string | null = null;
    const signed = await supabase.storage.from(bucketName).createSignedUrl(path, 300);
    if (!signed.error && signed.data?.signedUrl) {
      viewUrl = signed.data.signedUrl;
    } else if (storageBaseUrl) {
      const base = String(storageBaseUrl).replace(/\/$/, '');
      const suffix = base.includes('/object/public') ? `${bucketName}/${path}` : `object/public/${bucketName}/${path}`;
      viewUrl = `${base}/${suffix}`;
    } else {
      toast({ title: 'Failed to open file', description: 'Could not generate file URL.' });
      return;
    }
    // Open in new tab for viewing
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (path: string) => {
    // Prefer signed URL to avoid public URL edge cases and bucket visibility
    let downloadUrl: string | null = null;
    const parts = (path || '').split('/');
    const fileName = parts[parts.length - 1] || 'file';
    const signed = await supabase.storage.from(bucketName).createSignedUrl(path, 300, { download: fileName });
    if (!signed.error && signed.data?.signedUrl) {
      downloadUrl = signed.data.signedUrl;
    } else if (storageBaseUrl) {
      const base = String(storageBaseUrl).replace(/\/$/, '');
      const suffix = base.includes('/object/public') ? `${bucketName}/${path}` : `object/public/${bucketName}/${path}`;
      downloadUrl = `${base}/${suffix}`;
      // Force download for public URL
      downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + `download=${encodeURIComponent(fileName)}`;
    } else {
      const { data, error } = await supabase.storage.from(bucketName).download(path);
      if (error) {
        toast({ title: 'Download failed', description: error.message });
        return;
      }
      downloadUrl = URL.createObjectURL(data);
    }
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName; // will be respected for blob URL; signed/public URL already force attachment via param
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke only if we created an object URL
    if (downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl);
  };

  const handleDelete = async (path: string, rowId: string) => {
    setDeletingPath(path);
    setIsDeleting(true);
    try {
      await deleteFileViaEdge({ clientId, rowId, path });
      toast({ title: 'File deleted' });
      await refresh();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Unknown error' });
    } finally {
      setDeletingPath(null);
      setIsDeleting(false);
    }
  };

   useEffect(() => {
    const filterParam = searchParams.get("filter");

    if (!filterParam) {
      setStatusFilter("all");
      return;
    }

    // Map URL query -> dropdown values
    if (filterParam === "valid") {
      setStatusFilter("valid");
    } else if (filterParam === "nearing_invalid") {
      setStatusFilter("warning");
    } else if (filterParam === "invalid") {
      setStatusFilter("expired");
    } else {
      setStatusFilter("all");
    }
  }, [searchParams]);


  return (
    <Layout>
      {/* Global uploading overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]">
          {/* top-right progress widget */}
          <div className="absolute top-4 right-4 w-[min(92vw,320px)] rounded-xl border bg-white shadow-xl p-3 sm:p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">Uploading files…</span>
              <span className="text-xs text-gray-500">{totalProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded">
              <div className="h-2 rounded bg-blue-500 transition-all" style={{ width: `${totalProgress}%` }} />
            </div>
            {uploadItems.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">
                {uploadItems.filter(i=>i.status!=='done').length} of {uploadItems.length} remaining
              </div>
            )}
          </div>
        </div>
      )}
      {/* Global deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-xl border bg-white shadow-xl p-5 sm:p-6 text-sm flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium text-gray-800">Deleting…</span>
          </div>
        </div>
      )}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="enterprise-card p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <ShieldCheck className="h-6 w-6 text-primary mt-1 shrink-0" />

              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Compliance Documents
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Upload and manage compliance files for your organization.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center text-sm text-gray-600 flex-wrap">
                <button className="inline-flex items-center hover:text-blue-600" onClick={() => { setCurrentFolderId(null); setCurrentFolderName(null); setBreadcrumb([]); }}>
                  <Home className="h-4 w-4" />
                </button>
                {breadcrumb.map((seg, idx) => (
                  <div key={seg.rowId} className="inline-flex items-center">
                    <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />
                    <button
                      className={`truncate max-w-[120px] md:max-w-[180px] ${idx === breadcrumb.length - 1 ? 'font-semibold text-gray-800' : 'hover:text-blue-600'}`}
                      title={seg.name}
                      onClick={async () => {
                        setLoading(true);
                        setCurrentFolderId(seg.folderId);
                        setCurrentFolderName(seg.name);
                        setBreadcrumb(breadcrumb.slice(0, idx + 1));
                        await refresh();
                      }}
                    >
                      {seg.name}
                    </button>
                  </div>
                ))}
              </div>
              {/* Mobile breadcrumb */}
              {breadcrumb.length > 0 && (
                <div className="flex sm:hidden items-center text-xs text-gray-600 overflow-x-auto pb-1">
                  <button className="inline-flex items-center hover:text-blue-600 flex-shrink-0" onClick={() => { setCurrentFolderId(null); setCurrentFolderName(null); setBreadcrumb([]); }}>
                    <Home className="h-3 w-3" />
                  </button>
                  {breadcrumb.map((seg, idx) => (
                    <div key={seg.rowId} className="inline-flex items-center flex-shrink-0">
                      <ChevronRight className="mx-1 h-3 w-3 text-gray-400" />
                      <button
                        className={`truncate max-w-[80px] ${idx === breadcrumb.length - 1 ? 'font-semibold text-gray-800' : 'hover:text-blue-600'}`}
                        title={seg.name}
                        onClick={async () => {
                          setLoading(true);
                          setCurrentFolderId(seg.folderId);
                          setCurrentFolderName(seg.name);
                          setBreadcrumb(breadcrumb.slice(0, idx + 1));
                          await refresh();
                        }}
                      >
                        {seg.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setNewFolderOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />{' '}
                  <span className="hidden sm:inline">New</span> Folder
                </Button>
                {/* Export Files button with confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={exporting}
                    >
                      Export Files
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Do you want to download all files with their validity status?
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await handleExportFiles();
                        }}
                      >
                        Download
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents and folders…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              {showSearchDropdown && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg max-h-64 overflow-auto">
                {searchResults.map((result) =>
                    result.type === 'empty' ? (
                      <div
                        key="no-results"
                        className="px-3 py-2 text-gray-500 text-sm text-center"
                      >
                        {result.message}
                      </div>
                    ) : (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-gray-50"
                        onClick={() => {
                          if (result.type === 'folder') {
                            setCurrentFolderId(result.folderId);
                            setCurrentFolderName(result.folderName || result.name);
                          } else {
                            if (result.folderId) {
                              setCurrentFolderId(result.folderId);
                              setCurrentFolderName(result.folderName || '');
                            } else {
                              setCurrentFolderId(null);
                              setCurrentFolderName(null);
                            }
                          }
                          setSearchTerm('');
                        }}
                      >
                        <span className="mt-0.5">
                          {result.type === 'folder' ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                          ) : (
                            <File className="h-4 w-4 text-blue-500" />
                          )}
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-medium truncate">
                            {result.name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {result.fullPath}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="warning">Nearing Invalid</SelectItem>
                  <SelectItem value="expired">Invalid</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
               <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters ({activeFilterCount})
              </Button>
              )}
            </div>
          {/* Error Message Alert */}
          {uploadError && (
            <Alert variant="destructive" className="mt-4 sm:mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="break-words break-all">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* Drag & Drop area with Choose Files */}
          <div className="mt-4 sm:mt-6 border-2 border-dashed rounded-md p-6 sm:p-8 md:p-10 text-center text-gray-500">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm">Drag and drop files here, or click to browse</div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onChooseFiles} />
              <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                <span>Choose Files</span>
              </Button>
            </div>
          </div>

          {/* Grid of folders/files */}
          {!currentFolderId && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {visibleRootFolders.map((f) => (
                <div key={f.folder_id} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                  <div className="absolute top-2 right-2">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete({
                            id: f.id,
                            folder_id: f.folder_id,
                            name: f.name,
                          });
                        }}
                      >
                        {deletingFolderId === f.folder_id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                  <div onClick={async () => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); await refresh(); }} className="cursor-pointer">
                    <Folder className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xs sm:text-sm font-medium truncate px-1">{f.name.length > 100 ? f.name.substring(0, 100) + "..." : f.name}</div>
                  </div>
                </div>
              ))}
              {visibleRootFiles.map((it, idx) => {
                  const parts = (it.path || "").split("/");
                  const name = parts[parts.length - 1] || "file";
                  const status = getValidityStatus(it.is_valid, it.valid_date);
                  return (
                    <div key={`${it.path}-${idx}`} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleDownload(it.path)}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetValidityClick(it)}>
                              <CalendarIcon className="mr-2 h-4 w-4" /> Set Validity
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(it.path, it.rowId)}
                              className="text-red-600 focus:text-red-600"
                            >
                              {deletingPath === it.path ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    <div onClick={() => handleViewFile(it.path)} className="cursor-pointer relative">
                        {(status === "valid" || status === "no-validity") && (
                          <CheckCircle className="absolute -top-1 h-5 w-5 text-green-500 bg-white rounded-full" style={{right:"4rem"}} />
                        )}
                        {status === "expired" && (
                          <XCircle className="absolute -top-1 h-5 w-5 text-red-600 bg-white rounded-full"  style={{right:"4rem"}} />
                        )}
                        {status === "warning" && (
                          <AlertCircle className="absolute -top-1  h-5 w-5 text-yellow-500 bg-white rounded-full"  style={{right:"4rem"}} />
                        )}
                        <File className="sm:h-12 sm:w-12 text-blue-500 mx-auto mb-2" />
                        <div className="text-xs sm:text-sm font-medium truncate px-1">{name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentFolderId && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {/* child folders */}
              {visibleChildFolders.map((f) => (
                <div key={f.folder_id} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                              {deletingFolderId === f.folder_id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete folder "{f.name}"?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => {
                                try {
                                  setDeletingFolderId(f.folder_id);
                                  await deleteFolder(clientId, f.folder_id, employeeId, f.id);
                                  toast({ title: 'Folder deleted' });
                                  await refresh();
                                } finally {
                                  setDeletingFolderId(null);
                                }
                              }}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div onClick={async () => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); await refresh(); }} className="cursor-pointer">
                    <Folder className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xs sm:text-sm font-medium truncate px-1">{f.name}</div>
                  </div>
              </div>
            ))}
              {visibleCurrentFolderFiles.map((it, idx) => {
                const parts = (it.path || '').split('/');
                const name = parts[parts.length - 1] || 'file';
                const status = getValidityStatus(it.is_valid, it.valid_date);
                return (
                  <div key={`${it.path}-${idx}`} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleDownload(it.path)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetValidityClick(it)}>
                          <CalendarIcon className="mr-2 h-4 w-4" /> Set Validity
                        </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(it.path, it.rowId)} className="text-red-600 focus:text-red-600">
                            {deletingPath === it.path ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                   <div onClick={() => handleViewFile(it.path)} className="cursor-pointer relative">
                        {(status === "valid" || status === "no-validity") && (
                          <CheckCircle className="absolute -top-1 h-5 w-5 text-green-500 bg-white rounded-full" style={{right:"4rem"}} />
                        )}
                        {status === "expired" && (
                          <XCircle className="absolute -top-1 h-5 w-5 text-red-600 bg-white rounded-full"  style={{right:"4rem"}} />
                        )}
                        {status === "warning" && (
                          <AlertCircle className="absolute -top-1  h-5 w-5 text-yellow-500 bg-white rounded-full"  style={{right:"4rem"}} />
                        )}
                        <File className="sm:h-12 sm:w-12 text-blue-500 mx-auto mb-2" />
                        <div className="text-xs sm:text-sm font-medium truncate px-1">{name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {noResults && (
            <div className="col-span-full py-10 text-center text-gray-500 text-sm">
              No documents match the current search and validity filter.
            </div>
          )}
          <AlertDialog
            open={!!folderToDelete}
            onOpenChange={(open) => {
              if (!open) setFolderToDelete(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle   className="break-all whitespace-normal"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  {folderToDelete
                    ? `Delete folder "${
                        folderToDelete.name.length > 100
                          ? folderToDelete.name.substring(0, 100) + "..."
                          : folderToDelete.name
                      }"?`
                    : "Delete folder?"}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFolderToDelete(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!folderToDelete) return;
                    try {
                      setIsDeleting(true);
                      setDeletingFolderId(folderToDelete.folder_id);

                      await deleteFolder(
                        clientId,
                        folderToDelete.folder_id,
                        employeeId,
                        folderToDelete.id
                      );

                      toast({ title: "Folder deleted" });
                      await refresh();
                    } finally {
                      setDeletingFolderId(null);
                      setIsDeleting(false);
                      setFolderToDelete(null);
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {loading && (
            <div className="mt-4 sm:mt-6 flex items-center justify-center py-8 sm:py-10">
              <Loader text="Loading compliance documents..." />
            </div>
          )}
        </div>
      </div>

      <Dialog open={newFolderOpen} onOpenChange={(open) => {
        setNewFolderOpen(open);
        if (!open) {
          setFolderError(null);
          setFolderName('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          {folderError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="break-words break-all">
                {folderError}
              </AlertDescription>
            </Alert>
          )}
          <Input 
            placeholder="Folder name" 
            value={folderName} 
            onChange={(e) => {
              setFolderName(e.target.value);
              // Clear error when user starts typing
              if (folderError) setFolderError(null);
            }}
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && folderName.trim() && !creatingFolder) {
                createFolder();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewFolderOpen(false);
              setFolderError(null);
              setFolderName('');
            }}>Cancel</Button>
            <Button onClick={createFolder} disabled={creatingFolder || !folderName.trim()}>
              {creatingFolder ? (<span className="inline-flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Creating…</span>) : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



        <Dialog open={validityDialogOpen} onOpenChange={setValidityDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-semibold leading-none">
                Set Validity
              </DialogTitle>
              <span className="text-md text-muted-foreground">
                Choose the validity period for this document.
              </span>
            </DialogHeader>

            <div className="mt-2 space-y-4">
              <RadioGroup
          value={validityMode}
          onValueChange={(value) => setValidityMode(value as "none" | "date")}
          className="space-y-4"
        >
          {/* No Validity */}
          <div className="flex items-start gap-3">
            <RadioGroupItem className='mt-0.5 text-secondary border-secondary' value="none" id="validity-none" />
            <Label htmlFor="validity-none" className="text-sm font-medium leading-tight">
              No Validity
            </Label>
          </div>

          {/* Calendar Option */}
          <div className="flex items-start gap-3">
            <RadioGroupItem className='text-secondary border-secondary' value="date" id="validity-date" />

            <div className="flex-1">
              <Label
                htmlFor="validity-date"
                className="text-sm font-medium flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Calendar option
              </Label>

            {validityMode === "date" && (
              <div>
                <div className="flex flex-col mt-4 items-center justify-center">
                  <Input
                    type="date"
                    value={
                      validityDate
                        ? validityDate.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setValidityDate(
                        value ? new Date(value) : undefined
                      );
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-[250px]"
                  />
                </div>

                <p className="text-md mt-3 text-center text-muted-foreground">
                  {validityDate
                    ? `Selected date: ${formatDisplayDate(validityDate)}`
                    : "Selected date: —"}
                </p>
              </div>
            )}

            </div>
          </div>
        </RadioGroup>

            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setValidityDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                onClick={handleSaveValidity}
                disabled={validityMode === "date" && !validityDate}
                >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Layout>
  );
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default ComplianceDocumentsPage;

async function xhrPut(url: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = (evt.loaded / evt.total) * 100;
      onProgress?.(pct);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // Try to parse error response from server
        let errorMessage = `Upload failed with status ${xhr.status}`;
        try {
          if (xhr.responseText) {
            const parsed = JSON.parse(xhr.responseText);
            // Handle Supabase Storage error format
            if (parsed.message) {
              errorMessage = parsed.message;
            } else if (parsed.error) {
              errorMessage = parsed.error;
            } else if (parsed.statusCode === '409') {
              errorMessage = 'The resource already exists. Duplicate file names are not allowed.';
            }
            // Handle 409 Duplicate error specifically
            if (xhr.status === 409) {
              errorMessage = parsed.message || parsed.error || 'File already exists. Duplicate file names are not allowed.';
            }
          }
        } catch (e) {
          // If parsing fails, use status-based message
          if (xhr.status === 409) {
            errorMessage = 'File already exists. Duplicate file names are not allowed.';
          }
        }
        reject(new Error(errorMessage));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
