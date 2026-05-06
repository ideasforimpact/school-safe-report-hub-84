import http from "k6/http";
import { check, sleep } from "k6";

import { baseOptions, buildJsonHeaders, requireEnv } from "./config.js";

export const options = {
  ...baseOptions,
  thresholds: {
    ...baseOptions.thresholds,
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const authToken = __ENV.SUPABASE_AUTH_TOKEN;
  const apiKey = __ENV.SUPABASE_ANON_KEY;
  const clientId = requireEnv("CLIENT_ID");
  const employeeId = __ENV.EMPLOYEE_ID || null;
  const isSuperAdmin = (__ENV.IS_SUPER_ADMIN || "false").toLowerCase() === "true";

  const response = http.post(
    `${supabaseUrl}/functions/v1/dashboard-stats`,
    JSON.stringify({
      client_id: clientId,
      employee_id: employeeId,
      is_super_admin: isSuperAdmin,
    }),
    {
      headers: buildJsonHeaders({ authToken, apiKey }),
      tags: { endpoint: "dashboard-stats" },
    }
  );

  check(response, {
    "dashboard-stats returned 200": (r) => r.status === 200,
    "dashboard-stats returned monthly incidents data": (r) => {
      const body = r.json();
      return Array.isArray(body.monthlyIncidentsData);
    },
    "dashboard-stats returned open incidents count": (r) => {
      const body = r.json();
      return typeof body.openIncidents === "number";
    },
  });

  sleep(1);
}
