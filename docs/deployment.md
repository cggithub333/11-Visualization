# Deployment Architecture (`11-Visualization` — `archify.omnicrafts.uk`)

## 1. Overview & Hosting Topology

The **11-Visualization** Architecture Visualizer Application is deployed as a **zero-build static site** on **Cloudflare Pages** and served globally over Cloudflare's edge network at **`https://archify.omnicrafts.uk`**.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ GitHub Repository: cggithub333/11-Visualization                            │
│  ├── main branch ──────► Production Deployment (archify.omnicrafts.uk)     │
│  └── dev / feature ────► Preview Deployment (<hash>.archify-omnicrafts...) │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ Zero-Build Static Root (/)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Cloudflare Pages Project: archify-omnicrafts                               │
│  ├── Default Subdomain: archify-omnicrafts.pages.dev                       │
│  ├── Custom Domain:     https://archify.omnicrafts.uk                      │
│  ├── Build Command:     "" (none — native ES/UMD-Lite static modules)      │
│  └── Output Directory:  "" (repository root /)                             │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Cloudflare Zone DNS (omnicrafts.uk)                                        │
│  └── CNAME: archify.omnicrafts.uk ──► archify-omnicrafts.pages.dev         │
│      (Proxied: true, SSL/TLS: Full / Edge Certificate)                     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key Production Endpoints & Entry Assets

| Endpoint / Asset Path | Purpose | Expected HTTP Status |
| :--- | :--- | :---: |
| `https://archify.omnicrafts.uk/` | Main Visualizer Hub Shell (`index.html`) | `200 OK` |
| `https://archify.omnicrafts.uk/src/core/switcher.js` | Central Diagram Lifecycle Switcher & URL Query Router | `200 OK` |
| `https://archify.omnicrafts.uk/src/diagrams/runpod-serverless/engine.js` | Diagram 1: RunPod Serverless Autoscaling & Worker Simulation Engine | `200 OK` |
| `https://archify.omnicrafts.uk/src/diagrams/lexis-voice/lexis-engine.js` | Diagram 2: Lexis Voice Pipeline & vLLM/Ollama Deep-Dive Simulation Engine | `200 OK` |

---

## 2. Cloudflare Pages Configuration Contract

| Setting | Configured Value | Notes |
| :--- | :--- | :--- |
| **Pages Project Name** | `archify-omnicrafts` | Hosted under Cloudflare Account `<CLOUDFLARE_ACCOUNT_ID>` |
| **GitHub Repository** | `cggithub333/11-Visualization` | Automatic CI/CD deployment on `git push` |
| **Production Branch** | `main` | Pushes to `main` update `https://archify.omnicrafts.uk` |
| **Preview Deployments** | Enabled (`all` non-production branches) | Pushes to `dev` or feature branches generate isolated preview URLs |
| **Build Command** | `""` *(empty)* | Zero-bundler architecture; files are served directly |
| **Build Output Directory** | `""` *(repository root `/`)* | Serves `index.html`, `src/core/*`, and `src/diagrams/*` directly |
| **Custom Domain** | `archify.omnicrafts.uk` | Bound to `archify-omnicrafts` with proxied `CNAME` to `archify-omnicrafts.pages.dev` |

---

## 3. Separation from Local `cloudflared.service` Tunnels

Static hosting for `11-Visualization` is **completely decoupled** from local `cloudflared` daemon tunnels:

1. **Cloudflare Pages Edge Hosting (`archify.omnicrafts.uk`)**:
   - Served 100% from Cloudflare's edge CDN via `archify-omnicrafts.pages.dev`.
   - Requires **zero** local ports (no `localhost:8888` Python HTTP server) and **zero** `cloudflared` ingress rules.
2. **Local Production Tunnel (`/etc/cloudflared/config.yml` — `cloudflared.service`)**:
   - Runs `<TUNNEL_UUID>` (`omnicrafts-end4-tunnel`) exclusively for active local backend services (`vllm2.omnicrafts.uk` `:8000`, `api.omnicrafts.uk` `:9080`, `stt.omnicrafts.uk` `:8091`, and `tts.omnicrafts.uk` `:8092`).
   - The legacy temporary hostname `architecture.omnicrafts.uk` (`http://localhost:8888`) has been decommissioned from both Cloudflare DNS and `/etc/cloudflared/config.yml`.

---

## 4. Credential-Safe Operations & Rollback Commands (`james:pass-agent`)

All CLI operations interacting with the Cloudflare API MUST use `james:pass-agent` (`pass:run --persistent cloudflare`) so that `$CLOUDFLARE_API_TOKEN` is injected purely in-memory with active stream masking.

### 4.1 Verify Live Deployment & Asset Integrity

```bash
curl -fsSI https://archify.omnicrafts.uk | head -n 5
curl -fsSI https://archify.omnicrafts.uk/src/core/switcher.js | head -n 5
curl -fsSI https://archify.omnicrafts.uk/src/diagrams/runpod-serverless/engine.js | head -n 5
curl -fsSI https://archify.omnicrafts.uk/src/diagrams/lexis-voice/lexis-engine.js | head -n 5
```

### 4.2 Inspect Recent Cloudflare Pages Deployments

```bash
source ~/.james-pass-agent/init.sh && pass:run --persistent cloudflare -- bash -c '
CF_API="https://api.cloudflare.com/client/v4"
ACCT_ID=$(curl -fsS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "${CF_API}/accounts" | jq -r ".result[0].id")
curl -fsS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "${CF_API}/accounts/${ACCT_ID}/pages/projects/archify-omnicrafts/deployments" \
  | jq ".result[:5] | map({id: .id, url: .url, branch: .deployment_trigger.metadata.branch, commit: .deployment_trigger.metadata.commit_hash, status: .latest_stage.status, created_on: .created_on})"
'
```

### 4.3 Instant Rollback to a Previous Known-Good Deployment

To roll back `https://archify.omnicrafts.uk` to a previous deployment `<DEPLOYMENT_ID>` without force-pushing Git history:

```bash
source ~/.james-pass-agent/init.sh && pass:run --persistent cloudflare -- bash -c '
CF_API="https://api.cloudflare.com/client/v4"
ACCT_ID=$(curl -fsS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "${CF_API}/accounts" | jq -r ".result[0].id")
DEPLOYMENT_ID="<DEPLOYMENT_ID>"
curl -fsS -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "${CF_API}/accounts/${ACCT_ID}/pages/projects/archify-omnicrafts/deployments/${DEPLOYMENT_ID}/rollback" \
  | jq "{rollback_success: .success, active_deployment_id: .result.id, url: .result.url}"
'
```
