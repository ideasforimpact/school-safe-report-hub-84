const vus = Number(__ENV.K6_VUS || 5);
const duration = __ENV.K6_DURATION || "30s";

export const baseOptions = {
  vus,
  duration,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
  },
};

export const buildJsonHeaders = ({ authToken, apiKey } = {}) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (apiKey) {
    headers.apikey = apiKey;
  }

  return headers;
};

export const requireEnv = (name) => {
  const value = __ENV[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
