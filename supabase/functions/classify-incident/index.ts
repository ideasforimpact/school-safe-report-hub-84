import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openai = new OpenAI({ apiKey: openAiApiKey });

    const { description, categories } = await req.json();

    if (!description || !categories) {
      return new Response(
        JSON.stringify({ error: "description and categories are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `
You are an AI incident classification assistant.

Your task is to analyze the incident description provided by the user and suggest the TOP 3 MOST RELEVANT categories and their respective subcategories.

IMPORTANT RULES:

1. ONLY use the categories and subcategories provided below.
2. DO NOT create or modify any category or subcategory names.
3. DO NOT return categories outside the provided list.
4. Return maximum 3 categories.
5. Each category must contain maximum 3 relevant subcategories.
6. Rank categories and subcategories based on relevance.
7. Rank starts from 1.
8. The most relevant result should have rank 1.
9. If no suitable category/subcategory is found, return:
   {"error":"category and sub category cant be found"}
10. Response MUST be valid JSON only.
11. Do not include explanations, markdown, comments, or extra text.
12. Subcategories must belong to their respective category only.
13. Consider semantic meaning, not just keywords.
14. Handle spelling mistakes and short descriptions.
15. Prefer the most specific subcategory possible.

EXPECTED RESPONSE FORMAT:

{
  "suggestions": [
    {
      "category": "Category Name",
      "rank": 1,
      "subcategory": [
        {
          "name": "Subcategory Name",
          "rank": 1
        }
      ]
    }
  ]
}

USER INCIDENT DESCRIPTION:
"""
${description}
"""

AVAILABLE CATEGORIES:
${JSON.stringify(categories)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a strict JSON incident classification engine." },
        { role: "user", content: prompt },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid AI JSON response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validCategories = categories.map((c: any) => c.name);

    if (parsedResponse.suggestions) {
      for (const suggestion of parsedResponse.suggestions) {
        if (!validCategories.includes(suggestion.category)) {
          return new Response(
            JSON.stringify({ error: "AI returned invalid category" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const matchedCategory = categories.find((cat: any) => cat.name === suggestion.category);
        const validSubcategories = matchedCategory?.subcategories.map((sub: any) => sub.name) || [];

        for (const sub of suggestion.subcategory) {
          if (!validSubcategories.includes(sub.name)) {
            return new Response(
              JSON.stringify({ error: "AI returned invalid subcategory" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
      }
    }

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
