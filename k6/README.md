# k6 Performance Tests

This repo now includes a small `k6` starter focused on the three best first targets in this codebase:

- `worker-health.js`
- `validate-employee.js`
- `dashboard-stats.js`

These cover:

- a simple availability check for the internal worker
- the auth and access gate many app screens depend on
- a read-heavy dashboard function that is a good first performance baseline

## Install k6

`k6` is not installed through `npm`. Install it separately on your machine and make sure the `k6` binary is available in your shell.

## Scripts

From the repo root:

```bash
npm run perf:worker-health
npm run perf:validate-employee
npm run perf:dashboard-stats
```

## Environment Variables

### Worker health

Optional:

```bash
WORKER_BASE_URL=http://localhost:3000
```

### Supabase function tests

Required for `validate-employee.js`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_AUTH_TOKEN=authenticated-user-jwt
EMPLOYEE_ID=employee-id
CLIENT_ID=client-id
```

Required for `dashboard-stats.js`:

```bash
SUPABASE_URL=https://your-project.supabase.co
CLIENT_ID=client-id
```

Optional for `dashboard-stats.js`:

```bash
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_AUTH_TOKEN=authenticated-user-jwt
EMPLOYEE_ID=employee-id
IS_SUPER_ADMIN=true
```

If your environment enforces IP whitelisting or auth on `dashboard-stats`, pass the token and keys there too.

## Examples

### Local worker smoke test

```bash
npm run perf:worker-health
```

### Validate employee against Supabase

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
SUPABASE_AUTH_TOKEN=your-user-jwt \
EMPLOYEE_ID=your-employee-id \
CLIENT_ID=your-client-id \
npm run perf:validate-employee
```

### Dashboard stats load test

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
SUPABASE_AUTH_TOKEN=your-user-jwt \
CLIENT_ID=your-client-id \
EMPLOYEE_ID=your-employee-id \
IS_SUPER_ADMIN=false \
K6_VUS=10 \
K6_DURATION=1m \
npm run perf:dashboard-stats
```

## Recommendation

Run write-heavy flows like `create-incident` only against a dedicated test environment. Start with these read and validation endpoints first, then add one business-critical mutation flow once you are comfortable with the setup.
