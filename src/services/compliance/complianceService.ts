export type ComplianceUploadFile = { fileName: string; contentType: string; base64Data: string };

import { supabase } from '@/integrations/supabase/client';

export async function createPrimaryFolder(clientId: string, folderName: string, employeeId?: string | null, parentFolderId?: string | null) {
	const { data, error } = await supabase.functions.invoke('compliance-docs', {
		body: { action: 'create_folder', clientId, folderName, employeeId, parentFolderId }
	});
	if (error) throw error;
	return data as { success: boolean; folderId: string };
}

export async function createSubfolder(clientId: string, subPath: string) {
	const { data, error } = await supabase.functions.invoke('compliance-docs', {
		body: { action: 'create_subfolder', clientId, subPath }
	});
	if (error) throw error;
	return data as { success: boolean };
}

export async function uploadComplianceFiles(
	clientId: string,
	files: ComplianceUploadFile[],
	options?: { folderName?: string; parentFolderId?: string; employeeId?: string | null }
) {
	const { data, error } = await supabase.functions.invoke('compliance-docs', {
		body: { action: 'upload_files', clientId, files, folderName: options?.folderName, parentFolderId: options?.parentFolderId, employeeId: options?.employeeId }
	});
	if (error) throw error;
	return data as { success: boolean; paths: string[] };
}

export async function listComplianceObjects(clientId: string, path = '') {
	// Uses storage listing to show folders/files
	const bucket = 'compliance_documents';
	const base = path ? `${clientId}/${path}` : `${clientId}`;
	const { data, error } = await supabase.storage.from(bucket).list(base, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
	if (error) throw error;
	return data; // returns array with file/folder info
}

export async function deleteFolder(clientId: string, folderId: string, employeeId?: string | null, docId?: string | null) {
	const { data, error } = await supabase.functions.invoke('compliance-docs', {
		body: { action: 'delete_folder', clientId, folderId, employeeId, docId }
	});
	if (error) throw error;
	return data as { success: boolean };
}

export async function deleteFileViaEdge(params: { clientId: string; rowId: string; path: string; fileName?: string }) {
	const { data, error } = await supabase.functions.invoke('delete-compliance-file', {
		body: params,
	});
	if (error) throw error;
	return data as { success: boolean };
}

export async function enqueueUploadMetadata(payload: {
  clientId: string;
  employeeId?: string | null;
  parentFolderId?: string | null;
  folderName?: string | null;
  objectPath: string;
  fileName: string;
  contentType?: string;
  size?: number;
}) {
  const { data, error } = await supabase.functions.invoke('enqueue-upload', {
    body: payload,
  });
  if (error) throw error;
  return data as { success: boolean };
}

