# CRA Dev Server "Invalid Host header" Fix

When previewing the React app via a non-localhost URL (e.g., container/cloud preview), the CRA dev server may reject requests with:
"Invalid Host header".

This happens because the dev server enforces a host check to prevent DNS rebinding in development.

## Our Solution (applied)

We enable CRA's development-only override to bypass the host check:

- Added .env.development with:
  DANGEROUSLY_DISABLE_HOST_CHECK=true

- Also set the same variable in the npm start script for redundancy:
  "start": "cross-env DANGEROUSLY_DISABLE_HOST_CHECK=true react-scripts start"

Either one is sufficient; both are dev-only and do NOT affect production builds.

Security note:
- This setting is only used for the dev server (npm start).
- Production builds (npm run build) generate static files and do not run the dev server, so this setting does not reduce production security.

## Alternative Approaches (depending on CRA/dev-server versions)

- allowedHosts (Webpack Dev Server v4+):
  Some setups allow specifying allowedHosts in dev server config. CRA does not expose this directly without ejecting, so we avoided that.

- HOST and HTTPS env vars:
  If your preview platform provides a stable host (e.g., my-preview.example.com), CRA will still perform host checks, so this alone doesn't solve the problem.

- Using a reverse proxy or a tunnel:
  You could make the preview host resolve to localhost or tunnel traffic (e.g., via ngrok) to avoid the mismatch, but this adds complexity.

## Production Impact

- None. The setting is only applied when running the dev server (development mode).
- The production build does not embed or use this configuration.

## References

- CRA Advanced Configuration:
  https://create-react-app.dev/docs/advanced-configuration/
