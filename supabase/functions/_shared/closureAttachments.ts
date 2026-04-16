import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface ClosureAttachmentRow {
  id: string
  name: string
  path: string
  updatedAt: string
}

/** Normalized rows for merging uploads in close-incident (stable shape in DB). */
export function parseClosureAttachments(raw: unknown): ClosureAttachmentRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item): item is ClosureAttachmentRow =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as ClosureAttachmentRow).id === 'string' &&
        typeof (item as ClosureAttachmentRow).name === 'string' &&
        typeof (item as ClosureAttachmentRow).path === 'string'
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      updatedAt:
        typeof item.updatedAt === 'string'
          ? item.updatedAt
          : new Date().toISOString(),
    }))
}

export function mimeFromFileName(fileName: string): string {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

export interface ClosureDocumentPayload {
  id: string
  name: string
  type: string
  size: number
  url: string
  path: string
  uploadedAt: string
  source: 'closure'
}

/** Maps stored JSON + storage paths to public document payloads (sorted newest first). */
export function closureAttachmentsToDocuments(
  supabase: SupabaseClient,
  raw: unknown
): ClosureDocumentPayload[] {
  const list = Array.isArray(raw) ? raw : []
  return list
    .filter(
      (file: Record<string, unknown>) =>
        file &&
        typeof file.id === 'string' &&
        typeof file.name === 'string' &&
        typeof file.path === 'string'
    )
    .map((file: Record<string, unknown>): ClosureDocumentPayload => {
      const path = file.path as string
      const { data: pub } = supabase.storage
        .from('incident-closure-attachments')
        .getPublicUrl(path)
      const name = file.name as string
      return {
        id: file.id as string,
        name,
        type: mimeFromFileName(name),
        size: typeof file.size === 'number' ? file.size : 0,
        url: pub.publicUrl || '',
        path,
        uploadedAt:
          typeof file.updatedAt === 'string'
            ? file.updatedAt
            : new Date().toISOString(),
        source: 'closure',
      }
    })
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
}
