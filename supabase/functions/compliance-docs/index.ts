import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UploadFile = { fileName: string; contentType: string; base64Data: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, clientId, folderName, parentFolderId, files, employeeId, folderId, docId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const bucketName = "compliance_documents";

    // Ensure bucket exists (idempotent)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucketName, { public: false });
    }

    const toUint8 = (base64: string) => {
      const cleaned = base64.split(",").pop() ?? base64; // allow data URLs
      const bin = atob(cleaned);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    };

    // Helper: recursively list all file paths under a prefix
    const listAllPaths = async (prefix: string): Promise<string[]> => {
      const collected: string[] = [];
      const traverse = async (dir: string) => {
        const { data, error } = await supabaseAdmin.storage.from(bucketName).list(dir, { limit: 1000 });
        if (error) return; // ignore listing errors
        for (const entry of data || []) {
          if (entry.id) {
            // file
            collected.push(`${dir}/${entry.name}`.replace(/\/+/g, '/'));
          } else {
            // folder
            await traverse(`${dir}/${entry.name}`.replace(/\/+/g, '/'));
          }
        }
      };
      await traverse(prefix);
      return collected;
    };

    // Helper: ensure one primary registry row per client
    const getOrCreatePrimaryRow = async () => {
      const { data: row } = await supabaseAdmin
        .from("compliance_documents")
        .select("id, files, folder_exists, folder_id")
        .eq("client_id", clientId)
        .limit(1)
        .maybeSingle();

      if (row) return row;

      const insertRes = await supabaseAdmin
        .from("compliance_documents")
        .insert({ client_id: clientId, folder_exists: false, folder_id: null, files: [], created_by: employeeId ?? null })
        .select("id, files, folder_exists, folder_id")
        .single();
      if (insertRes.error) throw insertRes.error;
      return insertRes.data;
    };

    if (action === "create_folder") {
      // Create folder (root or nested)
      const newFolderId = crypto.randomUUID();

      // If nested, build full storage path from parent chain
      let storagePath: string;
      let parentRowId: string | null = null;
      const newFolderSlug = `${folderName}_${newFolderId}`;
      if (parentFolderId) {
        // Try to find parent by folder_id first to keep BC with FE
        const { data: parentRowByFolder, error: pErr1 } = await supabaseAdmin
          .from("compliance_documents")
          .select("id, parent_folder_id, files, folder_id")
          .eq("client_id", clientId)
          .eq("folder_id", parentFolderId)
          .maybeSingle();
        if (pErr1) throw pErr1;

        let parentRow = parentRowByFolder;
        if (!parentRow) {
          const { data: parentRowById, error: pErr2 } = await supabaseAdmin
            .from("compliance_documents")
            .select("id, parent_folder_id, files, folder_id")
            .eq("client_id", clientId)
            .eq("id", parentFolderId)
            .maybeSingle();
          if (pErr2) throw pErr2;
          parentRow = parentRowById;
        }

        if (!parentRow) throw new Error("Parent folder not found");
        parentRowId = parentRow.id;

        // Walk up to root to build path segments
        const segments: string[] = [];
        let walker: any = parentRow;
        const getSlug = (row: any) => row?.files?.[0]?.storage_folder ?? `${(row?.files?.[0]?.folder_name ?? "Folder").replaceAll('/', '-')}_${row?.folder_id ?? ''}`;
        segments.unshift(getSlug(walker));
        while (walker?.parent_folder_id) {
          const { data: up, error: upErr } = await supabaseAdmin
            .from("compliance_documents")
            .select("id, parent_folder_id, files, folder_id")
            .eq("id", walker.parent_folder_id)
            .maybeSingle();
          if (upErr) throw upErr;
          walker = up;
          if (walker) segments.unshift(getSlug(walker));
          else break;
        }
        storagePath = `${clientId}/${[...segments, newFolderSlug].join('/')}/.keep`;
      } else {
        storagePath = `${clientId}/${newFolderSlug}/.keep`;
      }

      await supabaseAdmin.storage.from(bucketName).upload(storagePath, new Uint8Array(), {
        upsert: true,
        contentType: "application/octet-stream",
      });

      const insertPayload: any = {
        client_id: clientId,
        folder_exists: true,
        folder_id: newFolderId,
        files: [{ folder_name: folderName, storage_folder: newFolderSlug, files: [] }],
        created_by: employeeId ?? null,
      };
      if (parentRowId) insertPayload.parent_folder_id = parentRowId;

      const { error: insErr } = await supabaseAdmin
        .from("compliance_documents")
        .insert(insertPayload);
      if (insErr) throw insErr;

      return new Response(
        JSON.stringify({ success: true, folderId: newFolderId }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Removed create_subfolder action for now (simplified model)

    if (action === "upload_files") {
      const fileList = (files as UploadFile[]) ?? [];

      // Server-side validation: max 25 files per request
      if (fileList.length > 25) {
        return new Response(
          JSON.stringify({ success: false, message: "You can upload a maximum of 25 files at a time." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate: images up to 5MB
      for (const f of fileList) {
        const isImage = (f.contentType || "").startsWith("image/");
        if (isImage) {
          try {
            const sizeBytes = toUint8(f.base64Data).length;
            if (sizeBytes > 5 * 1024 * 1024) {
              return new Response(
                JSON.stringify({ success: false, message: `${f.fileName} exceeds 5 MB limit for images.` }),
                { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
              );
            }
          } catch (_) {
            return new Response(
              JSON.stringify({ success: false, message: `Invalid image data for ${f.fileName}` }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
      }

      // Determine target folder in storage
      let baseFolder = `${clientId}`;
      if (parentFolderId) {
        const { data: parentRow, error: pfErr } = await supabaseAdmin
          .from("compliance_documents")
          .select("id, folder_id, files")
          .eq("client_id", clientId)
          .eq("folder_id", parentFolderId)
          .eq("created_by", employeeId ?? null)
          .maybeSingle();
        if (pfErr) throw pfErr;
        if (!parentRow) throw new Error("Parent folder not found for upload");
        const parentSlug = parentRow.files?.[0]?.storage_folder ?? `${parentRow.files?.[0]?.folder_name || 'Folder'}_${parentRow.folder_id}`;
        baseFolder = `${clientId}/${parentSlug}`;
      } else {
      const targetFolder = folderName && folderName.trim().length > 0 ? folderName : "general";
        baseFolder = `${clientId}/${targetFolder}`; // legacy non-folder uploads
      }

      const storedPaths: string[] = [];
      for (const f of fileList) {
        const objectPath = `${baseFolder}/${f.fileName}`;
        await supabaseAdmin.storage
          .from(bucketName)
          .upload(objectPath, toUint8(f.base64Data), { upsert: true, contentType: f.contentType });
        storedPaths.push(objectPath); // relative path only
      }

      // If a parentFolderId is provided, append to that folder's row.
      if (parentFolderId) {
        const { data: folderRow, error: findErr } = await supabaseAdmin
          .from("compliance_documents")
          .select("id, files")
          .eq("client_id", clientId)
          .eq("folder_id", parentFolderId)
          .eq("created_by", employeeId ?? null)
          .maybeSingle();
        if (findErr) throw findErr;

        if (folderRow) {
          // Support both legacy flat files array and new structured array [{ folder_name, files: [] }]
          let newFiles: any;
          if (Array.isArray(folderRow.files) && folderRow.files[0]?.files && Array.isArray(folderRow.files[0].files)) {
            const inner = folderRow.files[0].files ?? [];
            const mergedInner = inner.concat(storedPaths.map((p) => ({ path: p, parentFolderId })));
            newFiles = [{ folder_name: folderName ?? folderRow.files[0].folder_name ?? "Folder", files: mergedInner }];
          } else {
            newFiles = (folderRow.files ?? []).concat(
            storedPaths.map((p) => ({ path: p, parentFolderId }))
          );
          }
          const { error: updErr } = await supabaseAdmin
            .from("compliance_documents")
            .update({ files: newFiles })
            .eq("id", folderRow.id);
          if (updErr) throw updErr;
        } else {
          // Fallback: create a new folder row if not found (keeps model consistent)
          const fallbackFolderName = (folderName && folderName.trim().length > 0) ? folderName : "general";
          const { error: insErr } = await supabaseAdmin
            .from("compliance_documents")
            .insert({ 
              client_id: clientId, 
              folder_exists: true, 
              folder_id: parentFolderId, 
              files: [{ folder_name: fallbackFolderName, files: storedPaths.map((p)=>({ path:p, parentFolderId })) }], 
              created_by: employeeId ?? null 
            });
          if (insErr) throw insErr;
        }

        return new Response(
          JSON.stringify({ success: true, paths: storedPaths, folderId: parentFolderId }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Otherwise, this is a "no folder" upload: create a brand NEW row with folder_exists=false
      const { error: insErr } = await supabaseAdmin
        .from("compliance_documents")
        .insert({
          client_id: clientId,
          folder_exists: false,
          folder_id: null,
          files: storedPaths.map((p) => ({ path: p, parentFolderId: null })),
          created_by: employeeId ?? null
        });
      if (insErr) throw insErr;

      return new Response(
        JSON.stringify({ success: true, paths: storedPaths, folderId: null }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "delete_folder") {
      // Delete a folder by its folder_id or docId (row id)
      if (!folderId && !docId) throw new Error("folderId or docId is required");

      let row: any = null;
      let rowErr: any = null;
      if (docId) {
        const resp = await supabaseAdmin
          .from("compliance_documents")
          .select("id, files, folder_id")
          .eq("id", docId)
          .maybeSingle();
        row = resp.data; rowErr = resp.error;
      } else {
        const resp = await supabaseAdmin
          .from("compliance_documents")
          .select("id, files, folder_id")
          .eq("client_id", clientId)
          .eq("folder_id", folderId)
          .maybeSingle();
        row = resp.data; rowErr = resp.error;
      }
      if (rowErr) throw rowErr;
      if (!row) throw new Error("Folder not found");

      const slug = row.files?.[0]?.storage_folder ?? `${row.files?.[0]?.folder_name || 'Folder'}_${row.folder_id}`;
      const prefix = `${clientId}/${slug}`;
      // List and remove all files under this prefix (recursively)
      const paths = await listAllPaths(prefix);
      if (paths.length > 0) {
        await supabaseAdmin.storage.from(bucketName).remove(paths);
      }
      // Also remove the .keep marker if present
      await supabaseAdmin.storage.from(bucketName).remove([`${prefix}/.keep`]);

      // Delete DB row; children will cascade by FK
      const { error: delErr } = await supabaseAdmin
        .from("compliance_documents")
        .delete()
        .eq("id", row.id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});


