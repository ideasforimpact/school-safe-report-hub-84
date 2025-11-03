import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Folder, File, ArrowLeft, Loader2, MoreVertical, Download, Trash2, Home, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createPrimaryFolder,
  createSubfolder,
  uploadComplianceFiles,
  listComplianceObjects,
  type ComplianceUploadFile,
} from '@/services/compliance/complianceService';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteFolder } from '@/services/compliance/complianceService';

const ComplianceDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const clientId = (user as any)?.client_id || (user as any)?.clientId || '';
  const { getEmployeeId } = useEmployeeAccess();
  const employeeId = getEmployeeId();

  const [folders, setFolders] = useState<{ id: string; name: string; folder_id: string }[]>([]);
  const [rootFiles, setRootFiles] = useState<{ path: string; rowId: string }[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [currentFolderFiles, setCurrentFolderFiles] = useState<{ path: string; rowId: string }[]>([]);
  const [childFolders, setChildFolders] = useState<{ id: string; name: string; folder_id: string }[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ rowId: string; name: string; folderId: string }[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const bucketName = 'compliance_documents';
  const storageBaseUrl = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL as string | undefined;

  const refresh = async () => {
    if (!clientId || !employeeId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('compliance_documents')
      .select('id, folder_exists, folder_id, parent_folder_id, files')
      .eq('client_id', clientId)
      .eq('created_by', employeeId);
    if (error) throw error;

    if (!currentFolderId) {
      // Root view: only top-level folders (parent_folder_id is null) and general files (folder_exists=false)
      const folderRows = (data || []).filter((r: any) => r.folder_exists === true && (r.parent_folder_id === null || typeof r.parent_folder_id === 'undefined'));
      const nonFolderRows = (data || []).filter((r: any) => r.folder_exists === false);

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

      const files = nonFolderRows.flatMap((r: any) => (r.files || []).map((f: any) => ({ ...f, rowId: r.id })));
      setFolders(folderList);
      setRootFiles(files);
      setCurrentFolderFiles([]);
      setChildFolders([]);
      setBreadcrumb([]);
    } else {
      const folderRow = (data || []).find((r: any) => r.folder_id === currentFolderId);
      const filesArray = Array.isArray(folderRow?.files) && folderRow.files[0]?.files && Array.isArray(folderRow.files[0].files)
        ? folderRow.files[0].files
        : folderRow?.files || [];
      const files = filesArray.map((f: any) => ({ ...f, rowId: folderRow.id }));
      setCurrentFolderFiles(files);
      const children = (data || []).filter((r: any) => r.parent_folder_id === folderRow.id && r.folder_exists === true)
        .map((r: any) => ({ id: r.id as string, name: r.files?.[0]?.folder_name || 'Folder', folder_id: r.folder_id as string }));
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
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [clientId, employeeId, currentFolderId]);

  const onChooseFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !clientId) return;

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
    try {
      const payload: ComplianceUploadFile[] = await Promise.all(
        files.map(async (f) => ({
          fileName: f.name,
          contentType: f.type || 'application/octet-stream',
          base64Data: await fileToBase64(f),
        }))
      );
      if (currentFolderId) {
        await uploadComplianceFiles(clientId, payload, { parentFolderId: currentFolderId, employeeId });
      } else {
        await uploadComplianceFiles(clientId, payload, { folderName: 'general', employeeId });
      }
      await refresh();
      toast({ title: 'Upload complete', description: `${files.length} file(s) uploaded successfully` });
    } catch (err: any) {
      const description = err?.message || err?.error || 'Upload failed.';
      toast({ title: 'Upload failed', description });
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
    }
  };

  const createFolder = async () => {
    if (!folderName.trim() || !clientId) return;
    await createPrimaryFolder(clientId, folderName.trim(), employeeId, currentFolderId);
    setNewFolderOpen(false);
    setFolderName('');
    await refresh();
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
    const { error: remErr } = await supabase.storage.from(bucketName).remove([path]);
    if (remErr) {
      toast({ title: 'Delete failed', description: remErr.message });
      setDeletingPath(null);
      return;
    }
    const { data: rowData } = await (supabase as any)
      .from('compliance_documents')
      .select('files')
      .eq('id', rowId)
      .maybeSingle();
    const newFiles = (rowData?.files || []).filter((f: any) => f.path !== path);
    await (supabase as any)
      .from('compliance_documents')
      .update({ files: newFiles })
      .eq('id', rowId);
    toast({ title: 'File deleted' });
    await refresh();
    setDeletingPath(null);
  };

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6">
        <div className="enterprise-card p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold">Compliance Documents</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Upload and manage compliance files for your organization.</p>
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
                      onClick={() => {
                        setLoading(true);
                        setCurrentFolderId(seg.folderId);
                        setCurrentFolderName(seg.name);
                        setBreadcrumb(breadcrumb.slice(0, idx + 1));
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
                        onClick={() => {
                          setLoading(true);
                          setCurrentFolderId(seg.folderId);
                          setCurrentFolderName(seg.name);
                          setBreadcrumb(breadcrumb.slice(0, idx + 1));
                        }}
                      >
                        {seg.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" onClick={() => setNewFolderOpen(true)} className="w-full sm:w-auto">
                <FolderPlus className="h-4 w-4 mr-2"/> <span className="hidden sm:inline">New</span> Folder
              </Button>
            </div>
          </div>

          {/* Drag & Drop area with Choose Files */}
          <div className="mt-4 sm:mt-6 border-2 border-dashed rounded-md p-6 sm:p-8 md:p-10 text-center text-gray-500">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm">Drag and drop files here, or click to browse</div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onChooseFiles} />
              <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                {uploading ? (
                  <span className="inline-flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Uploading...</span>
                ) : (
                  <span>Choose Files</span>
                )}
              </Button>
            </div>
          </div>

          {/* Grid of folders/files */}
          {!currentFolderId && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {folders.map((f) => (
                <div key={f.folder_id} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); }}>
                          Open
                        </DropdownMenuItem>
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
                  <div onClick={() => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); }} className="cursor-pointer">
                    <Folder className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xs sm:text-sm font-medium truncate px-1">{f.name}</div>
                  </div>
                </div>
              ))}
              {rootFiles.map((it, idx) => {
                const parts = (it.path || '').split('/');
                const name = parts[parts.length - 1] || 'file';
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
                    <div onClick={() => handleViewFile(it.path)} className="cursor-pointer">
                      <File className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
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
              {childFolders.map((f) => (
                <div key={f.folder_id} className="relative p-4 sm:p-5 md:p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow text-center max-w-full">
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); }}>
                          Open
                        </DropdownMenuItem>
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
                  <div onClick={() => { setLoading(true); setCurrentFolderId(f.folder_id); setCurrentFolderName(f.name); }} className="cursor-pointer">
                    <Folder className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
                    <div className="text-xs sm:text-sm font-medium truncate px-1">{f.name}</div>
                  </div>
              </div>
            ))}
              {currentFolderFiles.map((it, idx) => {
                const parts = (it.path || '').split('/');
                const name = parts[parts.length - 1] || 'file';
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
                    <div onClick={() => handleViewFile(it.path)} className="cursor-pointer">
                      <File className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xs sm:text-sm font-medium truncate px-1">{name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="mt-4 sm:mt-6 flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
              <span className="text-xs sm:text-sm text-gray-600">Loading...</span>
          </div>
          )}
        </div>
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
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


