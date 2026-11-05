# Architecture Visualization Design Rules & System Topology Standards

This document establishes the mandatory architectural and visual design standards for the **Architecture Visualizer Hub** (`11-Visualization`), ensuring 100% fidelity to the core microservices draw.io specification (`/tmp/drawio/espp-microservice-architecture.drawio`, Tab 0: *"Full architecture"*) and eliminating AI aesthetic flaws.

---

## 1. Model-View-Controller (MVC) Icon-Only Triad & Strict Mediator Bus

Every microservice card presents its internal architectural layers through a clean, compact **MVC Interaction Stage** (`.mvc-triad-stage`), eliminating text clutter while strictly enforcing decoupled Hexagonal / MVC invariants:

1. **Subcomponents Represented by Lucide Icons Only**:
   - **View (Left)**: Represented exclusively with `<i data-lucide="eye-dashed"></i>` (`lucide-eye-dashed`). Handles ingress presentation, client rendering, and UI reception.
   - **Controller (Center)**: Represented exclusively with `<i data-lucide="gamepad-directional"></i>` (`lucide-gamepad-directional`). Serves as the central mediator hub and orchestration port.
   - **Model (Right)**: Represented exclusively with `<i data-lucide="book-bookmark"></i>` (`lucide-book-bookmark`). Manages persistent state, entities, and database repository adapters.

2. **Strict Architectural Decoupling Invariant (Controller as Sole Mediator)**:
   - **Model must NEVER know or directly reference View**.
   - **View must NEVER know or directly reference Model**.
   - **Controller is strictly the middle component** that receives signals from View, mediates operations to/from Model, and passes responses back to View or downstream services.
   - Signal buses (`.mvc-bus-view-ctrl` and `.mvc-bus-ctrl-model`) with animated pulsing dots visually depict this bidirectional flow (`View ⇄ Controller` and `Controller ⇄ Model`), with zero direct physical connection between View and Model.

3. **Compact Card Height & Minimal Footer**:
   - Eliminates the messy 12-line text blocks per card, reducing card height from ~250px to ~110px.
   - A single clean footer line provides the service role summary (or dynamic chunk / upload status badges) with ample whitespace and zero visual clutter.

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
