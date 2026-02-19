import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";
import { validateIPWhitelist } from "../_shared/safe-school/ipValidator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    const action: "create" | "edit" | "delete" =
      (body.action ?? "create").toLowerCase() === "edit"
        ? "edit"
        : (body.action ?? "create").toLowerCase() === "delete"
        ? "delete"
        : "create";

    const clientId: string | null = body.client_id ?? null;
    const employeeId: string | null = body.employee_id ?? null;
    const entryId: string | null = body.id ?? body.entry_id ?? null;
    const rawTitle: string = (body.title ?? "").trim();
    const rawDomainId: string | null = body.domain_id ?? null;
    const category: string = (body.category ?? "").trim();
    const cpdLearningRaw: string = (body.cpd_learning ?? "").trim();
    const rawHours: number | null =
      typeof body.hours === "number" ? body.hours : Number(body.hours ?? null);
    const capturedDateRaw: string | null = body.captured_date ?? null;
    const attachments: { name: string; type: string; base64: string }[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];
    const documentUrlsExisting: { path: string; name: string }[] | null = Array.isArray(body.document_urls_existing)
      ? body.document_urls_existing.filter((d: any) => d && typeof d.path === "string" && typeof d.name === "string")
      : null;

    if (!clientId || !employeeId) {
      return new Response(
        JSON.stringify({ success: false, error: "client_id and employee_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // For edit/delete we must have entry id
    if ((action === "edit" || action === "delete") && !entryId) {
      return new Response(
        JSON.stringify({ success: false, error: "id is required for edit/delete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabase,
      req,
      clientId,
      url.pathname,
    );
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "IP_NOT_WHITELISTED",
          message: "Access denied. Your IP address is not whitelisted for this client.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle delete separately (no title/domain/hours validation needed)
    if (action === "delete") {
      const { error: deleteError } = await supabase
        .from("cpd_entries")
        .update({ active: false })
        .eq("id", entryId)
        .eq("client_id", clientId)
        .eq("employee_id", employeeId);

      if (deleteError) {
        console.error("Error deleting CPD entry:", deleteError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to delete CPD entry" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // From here down we handle create/edit which both require title/domain/hours/date
    const title = rawTitle;
    const domainId = rawDomainId;
    const hours = rawHours;

    // Basic validation
    if (!title || title.length < 2 || title.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Title must be between 2 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const TITLE_REGEX = /^[A-Za-z0-9\s]+$/;
    if (!TITLE_REGEX.test(title)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Title can only contain letters, numbers and spaces",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!domainId) {
      return new Response(
        JSON.stringify({ success: false, error: "domain_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!capturedDateRaw) {
      return new Response(
        JSON.stringify({ success: false, error: "captured_date is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const capturedDate = new Date(capturedDateRaw);
    if (isNaN(capturedDate.getTime())) {
      return new Response(
        JSON.stringify({ success: false, error: "captured_date is invalid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (hours === null || isNaN(hours) || hours <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "hours must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // cpd_learning optional, min 2 max 2000 if provided
    const cpdLearning = cpdLearningRaw.length > 0 ? cpdLearningRaw : null;
    if (cpdLearning !== null && (cpdLearning.length < 2 || cpdLearning.length > 2000)) {
      return new Response(
        JSON.stringify({ success: false, error: "What did you learn must be between 2 and 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const BUCKET = "cpd_learning_attachments";
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5;
    if (attachments.length > maxFiles) {
      return new Response(
        JSON.stringify({ success: false, error: `Maximum ${maxFiles} files allowed` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ensure domain exists and get threshold
    const { data: domain, error: domainError } = await supabase
      .from("cpd_domain")
      .select("id, threshold")
      .eq("id", domainId)
      .eq("active", true)
      .single();

    if (domainError || !domain) {
      console.error("Error fetching CPD domain:", domainError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid CPD domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const threshold = (domain as any).threshold ?? 0;

    // For edit, fetch existing entry to adjust domain/hours calculations and document_urls
    let currentEntryHour = 0;
    let currentEntryDomainId: string | null = null;
    let existingDocumentUrls: { path: string; name: string }[] = [];
    if (action === "edit" && entryId) {
      const { data: existingEntry, error: existingEntryError } = await supabase
        .from("cpd_entries")
        .select("id, domain_id, hour, document_urls")
        .eq("id", entryId)
        .eq("client_id", clientId)
        .eq("employee_id", employeeId)
        .single();

      if (existingEntryError || !existingEntry) {
        console.error("Error fetching CPD entry for edit:", existingEntryError);
        return new Response(
          JSON.stringify({ success: false, error: "CPD entry not found for edit" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      currentEntryHour = existingEntry.hour ?? 0;
      currentEntryDomainId = existingEntry.domain_id ?? null;
      if (documentUrlsExisting !== null) {
        existingDocumentUrls = documentUrlsExisting;
      } else {
        const urls = (existingEntry as any).document_urls;
        existingDocumentUrls = Array.isArray(urls) ? urls : [];
      }
    }

    // Compute existing hours for this employee + (new) domain
    const { data: existingRows, error: existingError } = await supabase
      .from("cpd_entries")
      .select("id, hour")
      .eq("client_id", clientId)
      .eq("employee_id", employeeId)
      .eq("domain_id", domainId)
      .eq("active", true);

    if (existingError) {
      console.error("Error fetching existing CPD entries:", existingError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to validate hours" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let usedHours = (existingRows ?? []).reduce(
      (sum: number, row: any) => sum + (row.hour ?? 0),
      0,
    );

    // If editing and staying on same domain, subtract current entry hours from usedHours
    if (action === "edit" && currentEntryDomainId === domainId) {
      usedHours -= currentEntryHour;
    }

    // Blocking logic commented out: allow create/edit beyond domain threshold; client still shows warning below CPD Domain
    // const remaining = threshold > 0 ? Math.max(0, threshold - usedHours) : Infinity;
    // if (threshold > 0 && hours > remaining) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       error: `You can only add up to ${remaining}h for this domain based on the threshold`,
    //     }),
    //     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    //   );
    // }

    if (action === "edit" && entryId) {
      const entryIdForUpload = entryId;
      const documentUrlList = [...existingDocumentUrls];
      const seenNames = new Set(documentUrlList.map((d) => d.name.toLowerCase()));

      for (const att of attachments) {
        const name = att?.name ?? "";
        const type = att?.type ?? "application/octet-stream";
        const base64 = att?.base64 ?? "";
        if (!name || !base64) continue;
        if (seenNames.has(name.toLowerCase())) {
          return new Response(
            JSON.stringify({ success: false, error: `Duplicate file name: ${name}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        seenNames.add(name.toLowerCase());
        const buf = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        if (buf.length > maxSizeBytes) {
          return new Response(
            JSON.stringify({ success: false, error: `File "${name}" exceeds 10MB` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${clientId}/${entryIdForUpload}/${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, buf, { contentType: type, upsert: true });
        if (uploadErr) {
          console.error("cpd_learning upload error:", uploadErr);
          return new Response(
            JSON.stringify({ success: false, error: `Upload failed: ${uploadErr.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        documentUrlList.push({ path: filePath, name });
      }

      const { error: updateError } = await supabase
        .from("cpd_entries")
        .update({
          title,
          domain_id: domainId,
          category: category || "General",
          cpd_learning: cpdLearning,
          hour: hours,
          captured_date: capturedDate.toISOString().slice(0, 10),
          document_urls: documentUrlList,
          active: true,
        })
        .eq("id", entryId)
        .eq("client_id", clientId)
        .eq("employee_id", employeeId);

      if (updateError) {
        console.error("Error updating CPD entry:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update CPD entry" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, id: entryId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert CPD entry (create)
    const { data: insertData, error: insertError } = await supabase
      .from("cpd_entries")
      .insert({
        client_id: clientId,
        employee_id: employeeId,
        title,
        domain_id: domainId,
        category: category || "General",
        cpd_learning: cpdLearning,
        hour: hours,
        captured_date: capturedDate.toISOString().slice(0, 10),
        document_urls: [],
        active: true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting CPD entry:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create CPD entry" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newEntryId = insertData?.id;
    const documentUrlList: { path: string; name: string }[] = [];
    const seenNames = new Set<string>();

    for (const att of attachments) {
      const name = att?.name ?? "";
      const type = att?.type ?? "application/octet-stream";
      const base64 = att?.base64 ?? "";
      if (!name || !base64) continue;
      if (seenNames.has(name.toLowerCase())) {
        return new Response(
          JSON.stringify({ success: false, error: `Duplicate file name: ${name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      seenNames.add(name.toLowerCase());
      const buf = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      if (buf.length > maxSizeBytes) {
        return new Response(
          JSON.stringify({ success: false, error: `File "${name}" exceeds 10MB` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${clientId}/${newEntryId}/${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buf, { contentType: type, upsert: true });
      if (uploadErr) {
        console.error("cpd_learning upload error:", uploadErr);
        return new Response(
          JSON.stringify({ success: false, error: `Upload failed: ${uploadErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      documentUrlList.push({ path: filePath, name });
    }

    if (documentUrlList.length > 0) {
      const { error: updateDocErr } = await supabase
        .from("cpd_entries")
        .update({ document_urls: documentUrlList })
        .eq("id", newEntryId)
        .eq("client_id", clientId)
        .eq("employee_id", employeeId);
      if (updateDocErr) {
        console.error("cpd_learning document_urls update error:", updateDocErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: newEntryId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("cpd_learning error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

