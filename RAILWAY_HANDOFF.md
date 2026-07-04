# Grudge Map Railway Handoff

This repo (Grudge Map) is being deployed to Railway. The project, service, and
domain below are still provisioned under the old `nearpast` name — the notes
here describe the infrastructure **as actually configured**, so those literal
identifiers are left as-is rather than relabeled; rename the Railway project
and swap the domain separately if you want the infra name to match.

## Current Railway State

Workspace: `lukataylo's Projects`

Project:

- Name: `nearpast`
- Project ID: `02620a12-6c0e-4e95-8c13-cb2faf6de394`
- Environment: `production`
- Environment ID: `f77fc430-b0eb-407c-a9d9-953310ce9262`
- Dashboard: `https://railway.com/project/02620a12-6c0e-4e95-8c13-cb2faf6de394`

Services:

- `web`
  - Service ID: `155c3fca-c798-4b4f-8745-83362af060d3`
  - Railway URL: `https://web-production-a3baa.up.railway.app`
  - Custom domain attached in Railway: `https://nearpast.com`
  - Build: `pnpm --filter @grudgemap/web build`
  - Start: `pnpm --filter @grudgemap/web exec vite preview --host 0.0.0.0 --port $PORT`
  - Health: `/`
- `api`
  - Service ID: `707e1242-de60-4c86-8094-9156ec8aa5f6`
  - Railway URL: `https://api-production-5c12.up.railway.app`
  - Build: `pnpm --filter @grudgemap/server build`
  - Start: `pnpm --filter @grudgemap/server start`
  - Health: `/api/health`

The project is linked locally in this directory.

Stop point for the next agent:

- `api` deployed successfully with deployment ID `d3067000-34cb-400f-b594-4e3432feed71`.
- API health check passed at `https://api-production-5c12.up.railway.app/api/health`.
- `web` build completed successfully, but the Railway deployment failed its health check.
- Failed web deployment ID: `ac2659b3-1133-4e29-a518-0a69630e5197`.
- Web container logs showed Vite preview listening on port `8080`.
- Railway healthcheck attempts to `/` returned `service unavailable` until the deployment failed.
- `https://web-production-a3baa.up.railway.app` returned Railway fallback `404 Application not found` after the failed deployment.
- `nearpast.com` is attached to the `web` service in Railway with target port `8080`, but local DNS lookup did not resolve yet.

Do not assume the web service is live until a fresh deployment succeeds and the URL returns the app.

## Variables

`web` has:

- `VITE_API_BASE`
- `VITE_MOCK=false`
- `VITE_MAPBOX_ACCESS_TOKEN`
- `VITE_MAPBOX_STYLE=mapbox://styles/mapbox/light-v11`

`api` has:

- `AI_STORY_PROVIDER=gemini`
- `AI_TTS_PROVIDER=mock`
- `AI_STICKER_PROVIDER=mock`
- `DB_PROVIDER=memory`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`

`ELEVENLABS_VOICE_ID` was missing locally, so TTS is intentionally set to `mock` until a voice ID is added.

## Known Blockers

1. Web deployment healthcheck failed even though the runtime container printed:

   ```text
   Local:   http://localhost:8080/
   Network: http://10.x.x.x:8080/
   ```

   The current deploy config is:

   ```text
   startCommand: pnpm --filter @grudgemap/web exec vite preview --host 0.0.0.0 --port $PORT
   healthcheckPath: /
   healthcheckTimeout: 300
   ```

   Suggested fixes to try:

   - Replace Vite preview with a tiny static server that clearly binds to `$PORT`.
   - Or remove/adjust the Railway healthcheck in the dashboard if the CLI does not accept the patch.
   - Re-deploy only `web` after changing the service config.

2. Railway source configuration points at `https://github.com/lukataylo/talktohistory`, but Railway reported:

   ```text
   No GitHub installation found for repo: https://github.com/lukataylo/talktohistory
   ```

   Until the Railway GitHub app is installed for that repo, use `railway up` from the local checkout or connect the repo in the Railway dashboard.

3. Domain state:

   - `nearpast.com` is attached to the `web` service in Railway.
   - `www.nearpast.com` is not confirmed attached.
   - `api.nearpast.com` is not confirmed attached.
   - `nearpast.com` did not resolve during local `curl` verification, so registrar DNS still needs to be configured or propagated.

## Next-Agent Instructions

1. Re-authenticate Railway if needed:

   ```bash
   railway login
   railway whoami --json
   railway status --json
   ```

2. Install/connect the Railway GitHub app for:

   ```text
   https://github.com/lukataylo/talktohistory
   ```

   Then verify both services still have:

   ```bash
   railway environment config --json
   ```

3. Confirm or attach custom domains:

   ```bash
   railway domain --service web --json
   railway domain nearpast.com --service web --port 8080 --json
   railway domain www.nearpast.com --service web --json
   railway domain api.nearpast.com --service api --json
   ```

4. Add the DNS records returned by Railway at the domain registrar:

   - `nearpast.com` -> Railway target returned for the `web` service.
   - `www.nearpast.com` -> Railway target returned for the `web` service.
   - `api.nearpast.com` -> Railway target returned for the `api` service.

   Keep Cloudflare proxy disabled or set SSL/TLS mode according to Railway's domain guidance if using Cloudflare.

5. After `api.nearpast.com` is verified, switch the web build variable:

   ```bash
   railway variable set VITE_API_BASE=https://api.nearpast.com --service web --environment production
   ```

   Redeploy `web` afterward because `VITE_*` variables are baked into the frontend build.

6. Add ElevenLabs voice when ready:

   ```bash
   railway variable set ELEVENLABS_VOICE_ID=<voice-id> --service api --environment production
   railway variable set AI_TTS_PROVIDER=eleven --service api --environment production
   ```

7. Fix and redeploy `web`.

   One option is to add a production static server dependency/script, then update Railway start command:

   ```bash
   pnpm --filter @grudgemap/web add serve
   ```

   Example package script:

   ```json
   {
     "scripts": {
       "start": "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"
     }
   }
   ```

   Then configure Railway:

   ```bash
   railway environment edit \
     --environment production \
     --service-config web deploy.startCommand "pnpm --filter @grudgemap/web start" \
     --message "Use static web server for Railway"
   ```

   If the healthcheck remains blocked, change or remove it in the Railway dashboard.

8. Deploy or redeploy from this checkout:

   ```bash
   railway up --service web --environment production --detach -m "Deploy Grudge Map web"
   ```

   API is already live; redeploy it only if API code or variables change.

9. Verify:

   ```bash
   curl https://api-production-5c12.up.railway.app/api/health
   curl -I https://web-production-a3baa.up.railway.app
   curl -I https://nearpast.com
   ```

   After `api.nearpast.com` is attached and DNS resolves, also verify `https://api.nearpast.com/api/health`.

## Repo Docs To Update

After custom domains are live, update:

- `README.md` with production URLs.
- `.env.example` comments if `api.nearpast.com` becomes the default.
- Any deployment notes with DNS provider-specific records.

Do not commit `.env.local` or any Railway/API secrets.
