import http from "k6/http";
import { check, sleep } from "k6";

import { baseOptions, buildJsonHeaders, requireEnv } from "./config.js";

export const options = {
  ...baseOptions,
  thresholds: {
    ...baseOptions.thresholds,
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const authToken = requireEnv("SUPABASE_AUTH_TOKEN");
  const apiKey = requireEnv("SUPABASE_ANON_KEY");
  const employeeId = requireEnv("EMPLOYEE_ID");
  const clientId = requireEnv("CLIENT_ID");

  const response = http.post(
    `${supabaseUrl}/functions/v1/validate-employee`,
    JSON.stringify({
      employeeId,
      clientId,
    }),
    {
      headers: buildJsonHeaders({ authToken, apiKey }),
      tags: { endpoint: "validate-employee" },
    }
  );

  check(response, {
    "validate-employee returned 200": (r) => r.status === 200,
    "validate-employee returned valid=true": (r) => {
      const body = r.json();
      return body.valid === true;
    },
  });

  sleep(1);
}
