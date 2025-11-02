import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Agent, Runner, withTrace } from "https://esm.sh/@openai/agents@latest";
import { z } from "https://esm.sh/zod@3";

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
      owner_role: z.string(),
      due_days: z.number(),
      evidence_required: z.array(z.string()),
    }),
  ),
  preventive_actions: z.array(z.string()),
  policy_refs: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are a School Safety and Compliance Assistant for an Indian K-12 school group.

Your task is to review the incident data collected from the Safe School System and return practical, school-specific recommendations.

Respond ONLY in valid JSON format, following the structure below.

### Output Schema
{
  "summary": "string (1–2 sentences summarizing what likely happened)",
  "severity": "low | medium | high | critical",
  "immediate_actions": ["string"],
  "corrective_actions": [
    {
      "action": "string",
      "owner_role": "string",
      "due_days": "integer",
      "evidence_required": ["string"]
    }
  ],
  "preventive_actions": ["string"],
  "policy_refs": ["string"]
}

### Rules & Constraints
- Each "action" must be a clear, meaningful sentence of up to 250 characters.
- Provide *minimum 2* and *maximum 5* actions for each action type (immediate, corrective, preventive).
- Focus on school safety, compliance, and accountability.
- Use short, direct, actionable language starting with a verb.
- Avoid personal identifiers (names, photos, IDs).
- Follow CBSE / State Board norms for safety and compliance.
- Ensure actions are practical and context-specific (for Indian school settings).
- Return only valid JSON — no extra text, headers, or explanations.
- If no relevant policy applies, return an empty array for "policy_refs".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Prompt with incident data
    const instructionsWithIncident = `${SYSTEM_PROMPT}

    ### Incident Data to Analyze:
    ${JSON.stringify(incidentJson, null, 2)}

    Please analyze the above incident data and provide recommendations following the specified JSON format.`;

    // Pass apiKey directly as required
    const agent = new Agent({
      name: "School Safety Compliance Assistant",
      instructions: instructionsWithIncident,
      outputType: aiResultSchema,
      model: "gpt-4o-mini", // update model if needed
      apiKey: openAiApiKey, // Direct assignment
    });

    const runner = new Runner();

    const userMessage = `Analyze the incident data provided and generate recommendations in valid JSON.`;

    // Wrap runner.run with trace for monitoring
    const result = await withTrace(
      "prepare-recommended-action",
      async () => {
        return await runner.run(agent, userMessage);
      },
      {
        metadata: {
          client_id,
          employee_id,
        },
      }
    );
    const finalOutput = result.finalOutput || result.output || result;
    let parsedResult;

    // Parse JSON output robustly
    if (typeof finalOutput === "string") {
      try {
        parsedResult = JSON.parse(finalOutput);
      } catch {
        const match = finalOutput.match(/\{[\s\S]*\}$/);
        parsedResult = match ? JSON.parse(match[0]) : null;
        if (!parsedResult) throw new Error("Failed to extract JSON from response");
      }
    } else {
      parsedResult = finalOutput;
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
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to generate AI recommendations",
        details: error?.stack,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
