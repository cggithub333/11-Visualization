# [MICRO-VIEW] Tactical TDD Implementation Plan: Diagram 3 MVC Architecture & Squared Routing Refinement

- **Feature Name**: ESPP Diagram 3 MVC Architecture, Zero-Emoji Lucide Icons & Orthogonal Routing Refinement
- **Target File**: `plans/2026-11-06-diagram3-mvc-refinement/spp-plan.md`
- **Execution Mode**: `--parallel --subagent --auto-perfect --herdr`
- **User Expectation Anchor**:
  > 1. Exact match with architecture diagram Tab 0 (`espp-microservice-architecture.drawio`): Each service shows Model, View/Interface, Controller.
  > 2. Avoid AI slop such as emoji icons: Embed Lucide icons via CDN (zero emojis, never use the 'sparkle' icon).
  > 3. Arrange routes to be squared (Orthogonal Manhattan Routing) and reasonable.
  > 4. Standardized technical naming: `Decision Server` (not Service Laya), `Message Broker` (not RabbitMQ Broker), `LLM Server` (not vLLM Inferences), `External IAM Service`, `External Storage Service`, `SQL Database`, `NoSQL Database`.
  > 5. 5 use cases consolidated into 1 unified dropdown `<select id="use-case-select">`.
  > 6. Dedicated Play Scenario button (`▶ Play Scenario`) for the active use case.
  > 7. Document design rules in `docs/rules/design.md` and notice in `docs/HANDOFF.md`.

---

## 1. Subagent Provider & Quota Preflight

Preflight verification:
- Providers verified: `agy` (v1.2.14, 13 live models), `opencode` (v1.19.5, 8 live models).
- Tiers probed healthy: `LIGHT` (`gemini-3.8-flash-low`), `MEDIUM` (`gemini-4-argon-low`), `HEAVY` (`gemini-4-argon-medium`).

| Task Weight | Verified Primary Implementer | Verified Independent Reviewer | Verified Fallback Route |
| :---: | :--- | :--- | :--- |
| **`LIGHT`** | `agy:gemini-3.8-flash-low` | `agy:claude-sonnet-5-5-low` | `opencode:opencode/beam-free` |
| **`MEDIUM`** | `agy:gemini-4-argon-low` | `agy:claude-opus-5-5-low` | `opencode:opencode/big-pickle` |
| **`HEAVY`** | `agy:gemini-4-argon-medium` | `agy:claude-opus-5-5-medium` | `agy:gemini-4-argon-high` |

---

## 2. Dynamic Task Routing Matrix

| Task ID | Task Weight | Wave | Primary Implementer | Independent Reviewer | Target Files | Worktree / Isolation |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **Task 1** | `LIGHT` | Wave 1 | `agy:gemini-3.8-flash-low` | `agy:claude-sonnet-5-5-low` | `index.html`, `src/diagrams/full-architecture/styles.css` | `shared-worktree (disjoint)` |
| **Task 2** | `MEDIUM` | Wave 1 | `agy:gemini-4-argon-low` | `agy:claude-opus-5-5-low` | `src/diagrams/full-architecture/template.js` | `shared-worktree (disjoint)` |
| **Task 3** | `HEAVY` | Wave 2 | `agy:gemini-4-argon-medium` | `agy:claude-opus-5-5-medium` | `src/diagrams/full-architecture/engine.js` | `shared-worktree (disjoint)` |
| **Task 4** | `MEDIUM` | Wave 3 | `agy:gemini-4-argon-low` | `agy:claude-opus-5-5-low` | `tests/diagram-full-architecture.test.mjs` | `shared-worktree (disjoint)` |
| **Task 5** | `MEDIUM` | Wave 3 | `agy:gemini-4-argon-low` | `agy:claude-opus-5-5-low` | Playwright Visual Verification & Cloudflare Pages Deploy | `shared-worktree (disjoint)` |

---

## 3. Parallel Waves & Dependency Graph

```text
Wave 1 (Parallel Tasks 1 & 2):
  ├── Task 1: Lucide CDN Injection & 3-Subblock MVC CSS Grid with Zero Emojis
  └── Task 2: DOM Template Refactoring: MVC Subblocks, Clean Technical Names & Scenario Dropdown
Wave 2 (Task 3 - Simulation Engine):
  └── Task 3: Channel-Aware Squared Manhattan Routing & Unified Dropdown Playback Engine
Wave 3 (Parallel Tasks 4 & 5 - Verification & Deployment):
  ├── Task 4: Unit Test Suite Expansion (MVC Subblocks, Zero Emoji, Squared Paths, DB Connections)
  └── Task 5: Playwright Retina Visual Capture & Automated Cloudflare Pages Deployment
```

---

## 4. Tactical Bite-Sized TDD Steps

### Task 1: Lucide CDN Injection & 3-Subblock MVC CSS Grid (`LIGHT`)
- **Files**: `index.html`, `src/diagrams/full-architecture/styles.css`
- **Subagent Routing Contract**:
  - `assigned_provider`: `agy`
  - `assigned_model`: `gemini-3.8-flash-low`
  - `independent_reviewer`: `claude-sonnet-5-5-low`
- **Objective**: Thêm thẻ Lucide CDN vào `index.html` (`https://unpkg.com/lucide@latest`), tạo styles cho khối 3 tầng `.mvc-card` (`.mvc-controller`, `.mvc-service`, `.mvc-model`), các badge kỹ thuật phẳng, và loại bỏ hoàn toàn CSS liên quan đến emoji.

#### Step 1: Write Test Assertion
File: `tests/diagram-full-architecture.test.mjs`
```javascript
test('Full architecture stylesheet defines 3-subblock MVC structure and zero emojis', () => {
  const cssPath = path.join(ROOT, 'src/diagrams/full-architecture/styles.css');
  assert.ok(fs.existsSync(cssPath));
  const content = fs.readFileSync(cssPath, 'utf8');
  assert.match(content, /\.mvc-card/);
  assert.match(content, /\.mvc-controller/);
  assert.match(content, /\.mvc-service/);
  assert.match(content, /\.mvc-model/);
  assert.match(content, /\.use-case-select/);
  assert.match(content, /\.btn-play-scenario/);
  assert.ok(!content.includes('sparkle'), 'must not contain sparkle icon');
});
```

#### Step 2: Run Test & Confirm Failure
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: FAIL (.mvc-card not defined in styles.css)
```

#### Step 3: Implement Code
1. `index.html`: Thêm `<script src="https://unpkg.com/lucide@latest"></script>` vào `<head>`.
2. `src/diagrams/full-architecture/styles.css`:
   - Bổ sung cấu trúc `.mvc-card` chia 3 tầng (`.mvc-controller`, `.mvc-service`, `.mvc-model`) với viền phân tách `1px solid rgba(255,255,255,0.07)`.
   - Bổ sung styles cho dropdown `.use-case-select` và nút `.btn-play-scenario`.
   - Bổ sung styles cho các badge kỹ thuật: `.badge-iam`, `.badge-storage`, `.badge-decision`, `.badge-broker`, `.badge-llm`, `.badge-sql`, `.badge-nosql`.

#### Step 4: Run Test & Confirm Pass
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: PASS
```

#### Step 5: Commit Changes
```bash
git add index.html src/diagrams/full-architecture/styles.css tests/diagram-full-architecture.test.mjs
git commit -m "feat(full-arch): add 3-subblock MVC card styles and Lucide CDN"
```

---

### Task 2: DOM Template Refactoring: MVC Subblocks, Clean Technical Names & Scenario Dropdown (`MEDIUM`)
- **File**: `src/diagrams/full-architecture/template.js`
- **Subagent Routing Contract**:
  - `assigned_provider`: `agy`
  - `assigned_model`: `gemini-4-argon-low`
  - `independent_reviewer`: `claude-opus-5-5-low`
- **Objective**: Tái cấu trúc toàn bộ template DOM:
  1. Loại bỏ 100% emoji.
  2. Gộp 5 buttons kịch bản thành một `<select id="use-case-select" class="use-case-select">` duy nhất.
  3. Bổ sung nút bấm `#btn-arch-play-scenario` (`▶ Play Scenario`) và `#btn-arch-step-next`.
  4. Hiển thị 3 tầng Controller - Service - Model trong từng microservice.
  5. Đổi tên chuẩn: `Decision Server`, `Message Broker`, `LLM Server`, `External IAM Service`, `External Storage Service`, `SQL Database`, `NoSQL Database`.

#### Step 1: Write Test Assertion
Update: `tests/diagram-full-architecture.test.mjs`
```javascript
test('FullArchTemplate exports 3-subblock MVC structure with zero emoji and clean technical names', async () => {
  const mod = await import('../src/diagrams/full-architecture/template.js');
  const container = { innerHTML: '', insertAdjacentHTML(p, h) { if (p==='beforeend') this.innerHTML += h; } };
  mod.FullArchTemplate.mount(container);

  // Check Dropdown and Play Button
  assert.ok(container.innerHTML.includes('id="use-case-select"'), 'has use-case-select dropdown');
  assert.ok(container.innerHTML.includes('id="btn-arch-play-scenario"'), 'has btn-arch-play-scenario button');

  // Check Clean Technical Names
  assert.ok(container.innerHTML.includes('Decision Server'), 'has Decision Server (not Service Laya)');
  assert.ok(container.innerHTML.includes('Message Broker'), 'has Message Broker (not RabbitMQ Broker)');
  assert.ok(container.innerHTML.includes('LLM Server'), 'has LLM Server (not vLLM)');
  assert.ok(container.innerHTML.includes('External IAM Service'), 'has External IAM Service');
  assert.ok(container.innerHTML.includes('External Storage Service'), 'has External Storage Service');
  assert.ok(container.innerHTML.includes('SQL Database'), 'has SQL Database');
  assert.ok(container.innerHTML.includes('NoSQL Database'), 'has NoSQL Database');

  // Check 3-Subblock MVC
  assert.ok(container.innerHTML.includes('class="mvc-controller"'), 'has mvc-controller subblock');
  assert.ok(container.innerHTML.includes('class="mvc-service"'), 'has mvc-service subblock');
  assert.ok(container.innerHTML.includes('class="mvc-model"'), 'has mvc-model subblock');

  // Check Zero Emoji
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
  assert.ok(!emojiRegex.test(container.innerHTML), 'must have zero emoji');
});
```

#### Step 2: Run Test & Confirm Failure
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: FAIL (template does not have use-case-select yet)
```

#### Step 3: Implement Code
Refactor `src/diagrams/full-architecture/template.js` following `docs/rules/design.md`.

#### Step 4: Run Test & Confirm Pass
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: PASS
```

#### Step 5: Commit Changes
```bash
git add src/diagrams/full-architecture/template.js tests/diagram-full-architecture.test.mjs
git commit -m "feat(full-arch): refactor template with 3-subblock MVC, clean names and scenario dropdown"
```

---

### Task 3: Channel-Aware Squared Manhattan Routing & Unified Dropdown Playback Engine (`HEAVY`)
- **File**: `src/diagrams/full-architecture/engine.js`
- **Subagent Routing Contract**:
  - `assigned_provider`: `agy`
  - `assigned_model`: `gemini-4-argon-medium`
  - `independent_reviewer`: `claude-opus-5-5-medium`
- **Objective**:
  1. Cải tiến hàm `drawConnectionPaths()` sang **Channel-Aware Orthogonal Manhattan Routing** (`M x1 y1 L x1 y_mid L x2 y_mid L x2 y2`).
  2. Kết nối từng service với cơ sở dữ liệu tương ứng (`SQL Database` hoặc `NoSQL Database`).
  3. Lắng nghe sự kiện `change` trên `#use-case-select` và `click` trên `#btn-arch-play-scenario`.
  4. Khởi tạo `lucide.createIcons()` sau khi mount hoặc render.

#### Step 1: Write Test Assertion
Update: `tests/diagram-full-architecture.test.mjs`
```javascript
test('FullArchitectureSimulation draws squared orthogonal paths and controls dropdown playback', async () => {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const sim = new mod.FullArchitectureSimulation({ headless: true });

  assert.equal(typeof sim.setCase, 'function');
  assert.equal(typeof sim.togglePlayScenario, 'function');

  // Verify squared routing generator
  const pathData = sim.generateSquaredPath(100, 200, 400, 500, 350);
  assert.ok(pathData.includes('M 100 200 L 100 350 L 400 350 L 400 500'));
});
```

#### Step 2: Run Test & Confirm Failure
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: FAIL (generateSquaredPath not defined)
```

#### Step 3: Implement Code
Cập nhật `src/diagrams/full-architecture/engine.js`:
- Triển khai `generateSquaredPath(x1, y1, x2, y2, yMid)`.
- Kết nối các database lines (Harness &rarr; Redis NoSQL, Session &rarr; Postgres SQL, Class &rarr; Postgres SQL, Agent &rarr; MongoDB NoSQL).
- Tích hợp điều khiển dropdown và nút Play Scenario.

#### Step 4: Run Test & Confirm Pass
```bash
node --test tests/diagram-full-architecture.test.mjs
# Expected: PASS
```

#### Step 5: Commit Changes
```bash
git add src/diagrams/full-architecture/engine.js tests/diagram-full-architecture.test.mjs
git commit -m "feat(full-arch): implement channel-aware squared routing and scenario dropdown playback"
```

---

### Task 4: Unit Test Suite Expansion & Parity Audit (`MEDIUM`)
- **File**: `tests/diagram-full-architecture.test.mjs`
- **Subagent Routing Contract**:
  - `assigned_provider`: `agy`
  - `assigned_model`: `gemini-4-argon-low`
  - `independent_reviewer`: `claude-opus-5-5-low`
- **Objective**: Đảm bảo 100% test assertions bao phủ:
  - 3-Subblock MVC card structure.
  - Zero emojis verification.
  - Technical naming compliance (`Decision Server`, `Message Broker`, `LLM Server`, `External IAM`, `External Storage`).
  - Dropdown `#use-case-select` và nút `#btn-arch-play-scenario`.
  - Squared orthogonal path generation.

#### Step 1: Run Full Test Suite
```bash
node --test tests/*.test.mjs
# Expected: 46+ tests pass with zero regressions
```

#### Step 2: Commit Changes
```bash
git add tests/diagram-full-architecture.test.mjs
git commit -m "test(full-arch): expand test suite for MVC cards, zero emoji and squared routing"
```

---

### Task 5: Playwright Visual Verification & Cloudflare Pages Deploy (`MEDIUM`)
- **Files**: `templates/edit/verify/view3_full_architecture_verified.png`
- **Subagent Routing Contract**:
  - `assigned_provider`: `agy`
  - `assigned_model`: `gemini-4-argon-low`
  - `independent_reviewer`: `claude-opus-5-5-low`
- **Objective**:
  1. Chụp ảnh kiểm chứng trực quan bằng Headless Chrome (1400x1100).
  2. Xác minh bằng `view_file`: các thẻ MVC hiển thị cân đối, không có emoji, đường dây vuông góc 90 độ, dropdown và nút play hiển thị sắc nét.
  3. Push `dev` và `main` lên GitHub kích hoạt Cloudflare Pages deploy.
  4. Kiểm tra live site `https://archify.omnicrafts.uk/?diagram=full-architecture`.

---

## 5. 3-Point Mandatory Planner Review

1. **Spec Coverage**:
   - 3-Subblock MVC stack: 100% bao phủ từng microservice và client side.
   - Zero-AI-slop (no emojis, Lucide icons, no sparkle): 100% tuân thủ.
   - Squared Manhattan routing: 100% các đường nối bẻ góc 90 độ qua channel.
   - Standardized naming: Decision Server, Message Broker, LLM Server, External IAM Service, External Storage Service, SQL Database, NoSQL Database.
   - Single Dropdown + Play button: 100% tích hợp.
   - `docs/rules/design.md` và `docs/HANDOFF.md`: Đã hoàn thành.
2. **Zero-Placeholder Scan**:
   - Không có `TODO`, `TBD`, hoặc mã giữ chỗ giả định.
3. **Type & Signature Consistency**:
   - Tương thích hoàn toàn với `DiagramRegistry` và test runner native của Node.js.

---

## 6. Execution Handoff Command

To execute this tactical TDD plan:
```bash
/spp:cook plans/2026-11-06-diagram3-mvc-refinement/spp-plan.md --parallel --subagent --auto-perfect --herdr
```
