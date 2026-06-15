import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.4";
import { z } from "https://esm.sh/zod@3";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Input schema
const requestSchema = z.object({
  incidentJson: z.any(),
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
});

// Output schema
const aiResultSchema = z.object({
  summary: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  immediate_actions: z.array(z.string()),
  corrective_actions: z.array(
    z.object({
      action: z.string(),
      due_days: z.number(),
    }),
  ),
  preventive_actions: z.array(z.string()),
  policy_refs: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are a School Safety and Compliance Assistant for an Indian K-12 school group.

Your task is to review incident data collected from the Safe School System and return practical, school-specific recommendations in line with Indian national safety policies (NCPCR, POCSO, Ministry of Education, NDMA, State Board).

Respond ONLY in valid JSON format, following the structure below.

### Output Schema
{
  "summary": "string (1–2 sentences summarizing what likely happened)",
  "severity": "low | medium | high | critical",
  "immediate_actions": ["string"],
  "corrective_actions": [
    {
      "action": "string",
      "due_days": number
    }
  ],
  "preventive_actions": ["string"],
  "policy_refs": ["string"]
}

### Important Notes for corrective_actions:
* Each corrective action object MUST contain ONLY "action" (string) and "due_days" (number) fields.
* DO NOT include "owner_role" or "evidence_required" fields in corrective_actions.

### Rules & Constraints
* Use the latest CBSE, State Board, NCPCR, POCSO, Ministry of Education, and NDMA safety norms for all recommendations.
* For child safety, abuse, sexual misconduct, report/escalate as per POCSO guidelines within 24 hours.
* For emergencies (fire, bomb threat, disaster), escalate to management and authorities immediately.
* Each "action" must be clear, actionable, up to 250 characters.
* Provide 2–5 actions per action type.
* Actions must be practical, context-specific for Indian schools, and support compliance/accountability.
* Start actions with a direct verb ("Notify...", "Escalate...", "Inspect...", "Update records...", "Restrict access...").
* Never include personal identifiers (names, photos, IDs).
* Include policy references from Indian guidelines ("NCPCR/2021", "POCSO/2012 Sec 19", "NDMA/2020", "MoE/2025 Directive", etc.).
* Return only valid JSON — no extra text or headers.
* If no relevant policy applies, return an empty array for "policy_refs".
`;

const AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS = "incident_recommended_actions";

const supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate request
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { incidentJson, client_id, employee_id } = validatedData;

    const { data: featRow, error: featErr } = await supabaseAdmin
      .from("client_ai_features")
      .select("enabled")
      .eq("client_id", client_id)
      .eq("feature_key", AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS)
      .maybeSingle();

    if (featErr) {
      console.error("client_ai_features lookup failed:", featErr);
      return new Response(
        JSON.stringify({ error: "Could not verify AI feature settings for this client." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (featRow && featRow.enabled === false) {
      return new Response(
        JSON.stringify({ error: "AI recommended actions are disabled for this client." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Correct env variable name for OpenAI
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      // Debug: show missing key
      console.error("OPENAI_API_KEY is undefined or missing.");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openai = new OpenAI({ apiKey: openAiApiKey });

    const userMessage = `Analyze the following incident data and generate recommendations following the specified JSON format.

    ### Incident Data:
    ${JSON.stringify(incidentJson, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiResponse);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid AI JSON response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validatedResult = aiResultSchema.parse(parsedResult);

    return new Response(
      JSON.stringify({ success: true, data: validatedResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.error("prepare-recommended-action error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error)?.message || "Failed to generate AI recommendations",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
