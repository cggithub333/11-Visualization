# Architecture Visualization Design Rules & System Topology Standards

This document establishes the mandatory architectural and visual design standards for the **Architecture Visualizer Hub** (`11-Visualization`), ensuring 100% fidelity to the core microservices draw.io specification (`/tmp/drawio/espp-microservice-architecture.drawio`, Tab 0: *"Full architecture"*) and eliminating AI aesthetic flaws.

---

## 1. Model-View-Controller (MVC) 3-Subblock Stack

Every microservice and subsystem card must explicitly present its internal architectural layers, mirroring clean architecture and hexagonal boundaries:

1. **Client Side Layering**:
   - **View**: React UI components, Web Browser (Student, Mentor, Manager, Admin).
   - **Controller**: Next.js action handlers, Axios HTTP fetch, WebSocket `/ws` audio streaming.
   - **Model**: Zustand state store, Zod schema validation.

2. **Microservice 3-Subblock Stack**:
   Each service card is partitioned into 3 distinct, vertically stacked subblocks with subtle 1px dividers:
   - **Controller (Top)**: Ingress boundary, routing, protocol endpoints (`REST`, `WebSocket`, `gRPC`).
   - **Service / Use Case (Middle)**: Core application workflows, session orchestrator, domain policies, adaptive context FSM.
   - **Model / Repository (Bottom)**: Domain entities, state schemas, and database repository ports.

3. **Connected Database Services**:
   Every service must visibly connect to its designated persistent storage layer:
   - **SQL Database**: Managed PostgreSQL cluster (dedicated schemas: `session`, `class`, `harness`, `notification`, `rag`).
   - **NoSQL Database**: MongoDB for `Service-Agent` configs; Redis RAM cluster for `Service-Harness` session state and Zero-Disk AAC-ADTS audio ring buffer.

---

## 2. Zero-AI-Slop & Lucide Icons Standard

1. **Zero Emojis**: Never use generic emoji icons (such as 💻, 🛡️, ⚡, 📋, 🎓, 📚, 🤖, 🔔, 📬, 🗄️, 🧠, ☁️, 🎙️) in nodes, headers, or status badges.
2. **Lucide Icons**: Embed Lucide Icons (`https://unpkg.com/lucide@latest` or inline clean SVG) for crisp, publication-grade vector glyphs.
   - **Forbidden Icon**: Never use the `sparkle` / `sparkles` icon anywhere in the application.
3. **Flat Technical Protocol Badges**:
   - Use crisp rectangular badges with 1px borders and muted technical palettes: `[REST]`, `[WS]`, `[gRPC]`, `[AMQP]`, `[SQL]`, `[S3]`, `[RAM]`.

---

## 3. Squared / Orthogonal Manhattan Routing

1. **Strict 90-Degree Orthogonal Geometry**:
   - Never use wavy, diagonal, or cubic bezier curves that cut across component cards.
   - All connection routes must use squared Manhattan routing (`M x1 y1 L x1 y_mid L x2 y_mid L x2 y2`).
2. **Channel-Aware Routing**:
   - Signals and connection paths must travel strictly through horizontal and vertical routing channels between tiers before branching into target service ports.

---

## 4. Standardized Enterprise Technical Terminology

To maintain enterprise realism and decouple diagrams from private repository naming:

| Forbidden / Explicit Name | Canonical Architecture Term | Notes / Role |
| :--- | :--- | :--- |
| `Service Laya` | **Decision Server** | ModernBERT-Large 421M System 1 Intent Classifier (<70ms) |
| `RabbitMQ Broker` | **Message Broker** | Topic Exchanges, Transactional Outbox Events & DLQ |
| `vLLM Inferences` | **LLM Server** | Qwen 1.5B/7B AWQ System 2 Deep Reasoning Engine |
| `Microsoft Graph` / `Entra ID` | **External IAM Service** | OIDC Sign-in, Entra JWKS verification & directory |
| `Cloudflare R2` | **External Storage Service** | S3-compatible Object Storage for fragmented `.m4a` audio |
| `Supabase PG` | **SQL Database** | Managed PostgreSQL (isolated schemas per service) |
| `MongoDB / Redis` | **NoSQL Database** | Document store (Agent configs) & RAM audio buffer |

---

## 5. Scenario Control Bar (Single Dropdown & Dedicated Play Button)

1. **Single Unified Dropdown**:
   - Replace cluttered horizontal button arrays with a single `<select id="use-case-select">` dropdown listing all 5 canonical use cases:
     - `Case 1: Ingress & Session Initialization`
     - `Case 2: Real-time Speaking Turn & Audio Stream`
     - `Case 3: Dynamic Adaptive Context Switch`
     - `Case 4: Zero-Disk Buffer & External Storage Upload`
     - `Case 5: Transactional Outbox & Message Broker Fan-Out`
2. **Dedicated Scenario Playback**:
   - Provide an integrated `▶ Play Scenario` / `⏸ Pause` button and `⏭ Next Step` button that directly control execution of the selected scenario.
   - Synchronize selection with URL query parameter `?diagram=full-architecture&case=case-X`.
