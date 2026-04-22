import http from "k6/http";
import { check, sleep } from "k6";

import { baseOptions } from "./config.js";

export const options = {
  ...baseOptions,
  thresholds: {
    ...baseOptions.thresholds,
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const baseUrl = __ENV.WORKER_BASE_URL || "http://localhost:3000";
  const response = http.get(`${baseUrl}/health`);

  check(response, {
    "worker health returned 200": (r) => r.status === 200,
    "worker health payload includes ok status": (r) => {
      const body = r.json();
      return body.status === "ok";
    },
  });

  sleep(1);
}
