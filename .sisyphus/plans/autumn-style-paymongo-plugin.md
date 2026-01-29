# Autumn-Style PayMongo Plugin for Better-Auth

## TL;DR

> **Quick Summary**: Complete rewrite of the better-auth-paymongo plugin following Autumn's webhook-less billing pattern. Three core APIs (`/attach`, `/check`, `/track`) with PayMongo as the billing source of truth and a minimal local usage table for metering.
> 
> **Deliverables**:
> - New server plugin with `/attach`, `/check`, `/track` endpoints
> - Usage tracking table schema
> - Client plugin with actions and hooks (`useCheck`, `useSubscription`)
> - React integration with reactive billing state
> - Feature-based permission system
> 
> **Estimated Effort**: Large (5-7 days)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5 → Task 7

---

## Context

### Original Request
Create a better-auth plugin for PayMongo using the Autumn pattern (no webhooks). The plugin should use Autumn's three-endpoint architecture (`/attach`, `/check`, `/track`) with PayMongo as the billing provider.

### Interview Summary
**Key Discussions**:
- **Architecture**: Pure Autumn style - no billing state in local DB, query PayMongo in real-time
- **Billing Scope**: Support both user and organization billing
- **Migration**: Full replacement of existing plugin
- **Feature System**: Autumn-style feature-based permissions
- **Checkout**: PayMongo Hosted Checkout (Checkout Sessions API)
- **Customer**: No persistent PayMongo customer - guest checkout with email
- **Caching**: 60-second TTL cache for PayMongo responses
- **Usage Rollover**: Lazy reset on `/check` call when period expires

**Research Findings**:
- PayMongo has Checkout Sessions, Payment Intents, and Subscription APIs
- No native usage metering in PayMongo - must be custom-built
- Autumn pattern: `/attach` (purchase), `/check` (permission), `/track` (usage)
- Better-Auth plugins have server (endpoints, schema) and client (actions, atoms) components
- Current plugin stores `paymongoData` as JSON - this will be replaced

### Metis Review
**Identified Gaps** (addressed):
- PayMongo subscription status verification pattern: Use Checkout Session ID queries with cache
- Period rollover mechanism: Lazy reset on `/check` when period_end < now
- Scope creep on React hooks: Limited to `useCheck` and `useSubscription`
- Caching strategy: 60s TTL with stale-while-revalidate pattern

---

## Work Objectives

### Core Objective
Replace the existing better-auth-paymongo plugin with an Autumn-style architecture that treats PayMongo as the billing source of truth, eliminating webhook dependencies through direct API polling with intelligent caching.

### Concrete Deliverables
- `src/types.ts` - New type definitions for Autumn pattern
- `src/server.ts` - Server plugin with `/attach`, `/check`, `/track` endpoints
- `src/client.ts` - Client plugin with actions and reactive atoms
- `src/react.ts` - React hooks (`useCheck`, `useSubscription`)
- `src/cache.ts` - 60s TTL cache implementation
- Database schema for `paymongo_usage` table
- Complete replacement of existing implementation

### Definition of Done
- [x] `/attach` endpoint returns PayMongo checkout URL
- [x] `/check` endpoint returns `{ allowed, balance?, planId }` with 60s cache
- [x] `/track` endpoint decrements usage in local table
- [x] Client hooks reactively update on subscription changes
- [x] Period rollover works lazily without cron jobs
- [x] No webhook endpoints exist in the plugin

### Must Have
- Autumn-style three-endpoint API (`/attach`, `/check`, `/track`)
- Feature-based permission checking
- Usage metering with local storage
- 60s TTL caching for PayMongo responses
- Support for user and organization scopes
- PayMongo Checkout Sessions integration
- Client actions and React hooks

### Must NOT Have (Guardrails)
- ❌ Webhook endpoints (no `/webhook` route)
- ❌ PayMongo customer ID storage (guest checkout only)
- ❌ Add-on system (excluded from this version)
- ❌ Trial period logic (excluded from this version)
- ❌ Proration calculations (excluded from this version)
- ❌ Payment method storage / save-for-later
- ❌ Invoice generation
- ❌ Query PayMongo on every `/check` call (use cache)
- ❌ Stripe SDK concepts imported

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test setup in current project)
- **User wants tests**: Manual verification only
- **Framework**: N/A

### Manual Verification Procedures

Each TODO includes EXECUTABLE verification procedures using curl and the dev server:

**Standard Verification Pattern:**
1. Start dev server with `bun run dev`
2. Execute curl commands against endpoints
3. Validate JSON responses against expected schema
4. Check database state via direct queries

**Evidence Requirements (Agent-Executable):**
- Command output captured and compared against expected patterns
- JSON response fields validated with jq assertions
- Database state verified via sqlite/postgres CLI queries

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Define new type system
└── Task 2: Create usage table schema

Wave 2 (After Wave 1):
├── Task 3: Implement /attach endpoint
├── Task 4: Implement cache layer
└── (Task 3 depends on 1,2; Task 4 depends on 1)

Wave 3 (After Wave 2):
├── Task 5: Implement /check endpoint
├── Task 6: Implement /track endpoint
└── (Both depend on 2,4)

Wave 4 (After Wave 3):
├── Task 7: Create client plugin
└── Task 8: Create React hooks

Wave 5 (After Wave 4):
└── Task 9: Cleanup and final integration

Critical Path: Task 1 → Task 3 → Task 5 → Task 7 → Task 9
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 7 | None (foundation) |
| 2 | 1 | 3, 5, 6 | None |
| 3 | 1, 2 | 5, 7 | 4 |
| 4 | 1 | 5, 6 | 3 |
| 5 | 2, 3, 4 | 7 | 6 |
| 6 | 2, 4 | 7 | 5 |
| 7 | 5, 6 | 8, 9 | None |
| 8 | 7 | 9 | None |
| 9 | 8 | None | None (final) |

---

## TODOs

---

### Task 1: Define New Type System

**What to do**:
- Create new `src/types.ts` with Autumn-style types
- Define `FeatureConfig` (id, type: 'boolean' | 'metered', limit?)
- Define `PlanConfig` with features mapping
- Define `PaymongoAutumnConfig` with plans, features, scopes
- Define response types for each endpoint
- Export plugin inference types

**Must NOT do**:
- Import or reference old subscription types
- Include add-on or trial types
- Use Stripe-like subscription ID patterns

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Type definitions only, no complex logic
- **Skills**: [`brainstorming`]
  - `brainstorming`: Design clean type hierarchy

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 1 (foundation)
- **Blocks**: Tasks 2, 3, 4, 7
- **Blocked By**: None (can start immediately)

**References**:

**Pattern References** (existing code to follow):
- Extracted: `types.ts: BasePlanConfig, BaseAddonConfig patterns` - Structure for plan configs

**API/Type References** (contracts to implement against):
- PayMongo Checkout Session response shape
- Better-Auth plugin type inference patterns

**External References**:
- Autumn's type patterns from research (feature-based with balance/allowed)

**Acceptance Criteria**:

```bash
# After implementation:
bun run build

# Assert: No TypeScript errors
# Assert: dist/types.d.ts exists with exported types

# Verify type exports:
bun -e "import { type PaymongoAutumnConfig, type FeatureConfig, type PlanConfig } from './src/types'; console.log('Types exported successfully')"
# Assert: Output is "Types exported successfully"
```

**Evidence to Capture:**
- [x] Build output showing no errors
- [x] Type file inspection

**Commit**: YES
- Message: `feat(types): define autumn-style type system`
- Files: `src/types.ts`
- Pre-commit: `bun run build`

---

### Task 2: Create Usage Table Schema

**What to do**:
- Add `paymongoUsage` table to plugin schema in `src/server.ts`
- Fields: `id`, `entityType` (user|organization), `entityId`, `featureId`, `balance`, `limit`, `periodStart`, `periodEnd`, `planId`, `checkoutSessionId`, `createdAt`, `updatedAt`
- Ensure schema follows Better-Auth adapter patterns
- Add necessary indexes for entity queries

**Must NOT do**:
- Store subscription state (no status field)
- Store PayMongo customer ID
- Reference old paymongoData field

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Schema definition, straightforward DB work
- **Skills**: [`brainstorming`]
  - `brainstorming`: Optimal schema design

**Parallelization**:
- **Can Run In Parallel**: NO (depends on types)
- **Parallel Group**: Wave 1
- **Blocks**: Tasks 3, 5, 6
- **Blocked By**: Task 1

**References**:

**Pattern References** (existing code to follow):
- Extracted: `server.ts: schema extension pattern with id='paymongo'`
- Better-Auth adapter schema patterns

**Acceptance Criteria**:

```bash
# After implementation, verify schema compiles:
bun run build
# Assert: No errors

# Inspect schema definition:
bun -e "
import { paymongo } from './src/server';
const plugin = paymongo({ secretKey: 'test', plans: {}, features: {} });
console.log(JSON.stringify(Object.keys(plugin.schema || {})));
"
# Assert: Output includes "paymongoUsage"
```

**Evidence to Capture:**
- [x] Build output
- [x] Schema inspection showing paymongoUsage table

**Commit**: YES
- Message: `feat(schema): add paymongoUsage table for metering`
- Files: `src/server.ts`
- Pre-commit: `bun run build`

---

### Task 3: Implement /attach Endpoint

**What to do**:
- Create `POST /paymongo/attach` endpoint
- Accept: `{ planId, successUrl, cancelUrl, organizationId? }`
- Call PayMongo Checkout Sessions API to create session
- Set line items from plan config (amount, currency)
- Include user email from session
- Return: `{ checkoutUrl, sessionId }`
- Store sessionId in usage table for later `/check` queries

**Must NOT do**:
- Create PayMongo customer
- Store payment method
- Handle webhooks

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
  - Reason: Core endpoint with PayMongo API integration
- **Skills**: [`brainstorming`]
  - `brainstorming`: API design and error handling

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Task 4)
- **Blocks**: Tasks 5, 7
- **Blocked By**: Tasks 1, 2

**References**:

**Pattern References** (existing code to follow):
- Extracted: `server.ts: createAuthEndpoint(), sessionMiddleware patterns`

**API/Type References** (contracts to implement against):
- PayMongo POST /v1/checkout_sessions
- PayMongo API response shapes

**External References**:
- PayMongo Checkout Sessions API docs

**Acceptance Criteria**:

```bash
# Start test server (assumes auth configured):
# Call /attach endpoint:
curl -s -X POST http://localhost:3000/api/auth/paymongo/attach \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{
    "planId": "pro",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }' | jq '.'

# Assert: Response contains:
# - checkoutUrl: string (https://checkout.paymongo.com/...)
# - sessionId: string (cs_...)

# Verify database entry created:
# (SQL query depends on adapter - example for SQLite)
sqlite3 ./dev.db "SELECT * FROM paymongo_usage ORDER BY created_at DESC LIMIT 1"
# Assert: Row exists with checkoutSessionId = sessionId from response
```

**Evidence to Capture:**
- [x] curl response JSON
- [x] Database row verification

**Commit**: YES
- Message: `feat(endpoints): implement /attach for checkout sessions`
- Files: `src/server.ts`
- Pre-commit: `bun run build`

---

### Task 4: Implement Cache Layer

**What to do**:
- Create `src/cache.ts` with simple in-memory TTL cache
- Implement `get(key)`, `set(key, value, ttl)`, `delete(key)`
- Default TTL: 60 seconds
- Use stale-while-revalidate pattern: return stale, trigger background refresh
- Key format: `paymongo:${entityType}:${entityId}:subscription`

**Must NOT do**:
- Use external cache (Redis) - start with in-memory
- Cache forever (must have TTL)
- Block on cache miss (async refresh pattern)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Simple utility module
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Task 3)
- **Blocks**: Tasks 5, 6
- **Blocked By**: Task 1

**References**:

**Pattern References** (existing code to follow):
- Standard Map-based TTL cache patterns

**Acceptance Criteria**:

```bash
# Unit test the cache:
bun -e "
import { cache } from './src/cache';

// Test set and get
cache.set('test-key', { value: 42 }, 60);
const result = cache.get('test-key');
console.log('Get test:', result?.value === 42 ? 'PASS' : 'FAIL');

// Test TTL expiry (mock with 0 TTL)
cache.set('expire-key', { value: 1 }, 0);
await new Promise(r => setTimeout(r, 10));
const expired = cache.get('expire-key');
console.log('Expiry test:', expired === null ? 'PASS' : 'FAIL');

// Test delete
cache.set('delete-key', { value: 1 }, 60);
cache.delete('delete-key');
const deleted = cache.get('delete-key');
console.log('Delete test:', deleted === null ? 'PASS' : 'FAIL');
"
# Assert: All tests output "PASS"
```

**Evidence to Capture:**
- [x] Test output showing PASS for all cache operations

**Commit**: YES
- Message: `feat(cache): add 60s TTL in-memory cache layer`
- Files: `src/cache.ts`
- Pre-commit: `bun run build`

---

### Task 5: Implement /check Endpoint

**What to do**:
- Create `GET /paymongo/check` endpoint
- Accept query: `?feature=<featureId>&organizationId=<optional>`
- Check cache first, query PayMongo checkout session status if stale
- For metered features: check usage table balance
- For boolean features: check if plan includes feature
- Handle period rollover: if `periodEnd < now`, reset balance to limit
- Return: `{ allowed: boolean, balance?: number, limit?: number, planId?: string }`

**Must NOT do**:
- Query PayMongo on every request (use cache)
- Store subscription status locally
- Return sensitive payment info

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
  - Reason: Core authorization logic with caching
- **Skills**: [`brainstorming`]
  - `brainstorming`: Permission logic design

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (with Task 6)
- **Blocks**: Task 7
- **Blocked By**: Tasks 2, 3, 4

**References**:

**Pattern References** (existing code to follow):
- Extracted: `server.ts: sessionMiddleware, adapter.findOne patterns`

**API/Type References**:
- PayMongo GET /v1/checkout_sessions/:id response
- Cache layer from Task 4

**Acceptance Criteria**:

```bash
# After user completes checkout, test /check:
curl -s http://localhost:3000/api/auth/paymongo/check?feature=api_calls \
  -H "Cookie: better-auth.session_token=..." | jq '.'

# Assert for metered feature:
# {
#   "allowed": true,
#   "balance": 1000,
#   "limit": 1000,
#   "planId": "pro"
# }

# Test boolean feature:
curl -s http://localhost:3000/api/auth/paymongo/check?feature=premium_access \
  -H "Cookie: better-auth.session_token=..." | jq '.'

# Assert for boolean:
# {
#   "allowed": true,
#   "planId": "pro"
# }

# Test caching (second call should be faster):
time curl -s http://localhost:3000/api/auth/paymongo/check?feature=api_calls \
  -H "Cookie: better-auth.session_token=..." > /dev/null
# Assert: Response time < 50ms (cached)
```

**Evidence to Capture:**
- [x] Metered feature response JSON
- [x] Boolean feature response JSON
- [x] Timing showing cache hit

**Commit**: YES
- Message: `feat(endpoints): implement /check with caching and period rollover`
- Files: `src/server.ts`
- Pre-commit: `bun run build`

---

### Task 6: Implement /track Endpoint

**What to do**:
- Create `POST /paymongo/track` endpoint
- Accept: `{ feature: string, delta?: number, organizationId?: string }`
- Default delta to 1 if not provided
- Find usage row for entity + feature
- Decrement balance by delta
- Return: `{ success: boolean, balance: number, limit: number }`
- Do NOT block if balance would go negative (track anyway, /check will deny)

**Must NOT do**:
- Call PayMongo API (usage is local only)
- Block tracking on zero balance
- Reset period (that's /check's job)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Simple CRUD operation
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (with Task 5)
- **Blocks**: Task 7
- **Blocked By**: Tasks 2, 4

**References**:

**Pattern References**:
- Extracted: `server.ts: adapter.update patterns`

**Acceptance Criteria**:

```bash
# Track usage:
curl -s -X POST http://localhost:3000/api/auth/paymongo/track \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"feature": "api_calls", "delta": 5}' | jq '.'

# Assert:
# {
#   "success": true,
#   "balance": 995,
#   "limit": 1000
# }

# Verify database:
sqlite3 ./dev.db "SELECT balance FROM paymongo_usage WHERE feature_id='api_calls'"
# Assert: Balance decreased by 5

# Track with default delta:
curl -s -X POST http://localhost:3000/api/auth/paymongo/track \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"feature": "api_calls"}' | jq '.balance'

# Assert: Balance is now 994
```

**Evidence to Capture:**
- [x] Track response JSON
- [x] Database balance verification

**Commit**: YES
- Message: `feat(endpoints): implement /track for usage metering`
- Files: `src/server.ts`
- Pre-commit: `bun run build`

---

### Task 7: Create Client Plugin

**What to do**:
- Rewrite `src/client.ts` for Autumn pattern
- Export `paymongoClient` function
- Define actions: `attach(planId, options)`, `check(featureId)`, `track(featureId, delta?)`
- Use nanostores atoms for reactive state: `$subscription`, `$features`
- Auto-refresh subscription on `attach` success
- Infer types from server plugin

**Must NOT do**:
- Include old action methods (createSubscription, etc.)
- Store payment methods
- Expose sensitive data

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
  - Reason: Client SDK with reactivity
- **Skills**: [`react-component-architecture`]
  - `react-component-architecture`: Reactive patterns

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 4
- **Blocks**: Task 8
- **Blocked By**: Tasks 5, 6

**References**:

**Pattern References**:
- Extracted: `client.ts: nanostores atoms, getAtoms/getActions pattern`

**Acceptance Criteria**:

```bash
# Build succeeds:
bun run build
# Assert: No errors

# Verify exports:
bun -e "
import { paymongoClient } from './src/client';
const client = paymongoClient();
console.log('attach:', typeof client.attach);
console.log('check:', typeof client.check);
console.log('track:', typeof client.track);
"
# Assert: All output "function"
```

**Evidence to Capture:**
- [x] Build output
- [x] Export verification

**Commit**: YES
- Message: `feat(client): autumn-style client with attach/check/track actions`
- Files: `src/client.ts`
- Pre-commit: `bun run build`

---

### Task 8: Create React Hooks

**What to do**:
- Rewrite `src/react.ts` with Autumn-pattern hooks
- `useCheck(featureId)` - Returns `{ allowed, balance, limit, loading, error }`
- `useSubscription()` - Returns `{ planId, status, refresh }`
- Use nanostores/react for reactivity
- Auto-refetch on window focus (optional)

**Must NOT do**:
- Create useCustomer (no customer concept)
- Create usePaymentMethods
- Include add-on or trial hooks

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
  - Reason: React hooks for UI
- **Skills**: [`react-component-architecture`]
  - `react-component-architecture`: Hook patterns

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 4
- **Blocks**: Task 9
- **Blocked By**: Task 7

**References**:

**Pattern References**:
- None (task is self-contained)

**External References**:
- @nanostores/react useStore pattern for reactive hooks

**External References**:
- @nanostores/react useStore patterns

**Acceptance Criteria**:

```bash
# Build succeeds:
bun run build
# Assert: No errors

# Verify exports:
bun -e "
import { useCheck, useSubscription } from './src/react';
console.log('useCheck:', typeof useCheck);
console.log('useSubscription:', typeof useSubscription);
"
# Assert: Both output "function"
```

**Evidence to Capture:**
- [x] Build output
- [x] Export verification

**Commit**: YES
- Message: `feat(react): add useCheck and useSubscription hooks`
- Files: `src/react.ts`
- Pre-commit: `bun run build`

---

### Task 9: Cleanup and Final Integration

**What to do**:
- Remove ALL old code from src/server.ts, src/client.ts, src/react.ts, src/types.ts
- Update `src/index.ts` barrel exports
- Update `package.json` if any deps changed
- Run full build and verify no old exports remain
- Create example configuration in README

**Must NOT do**:
- Leave dead code
- Keep backward compatibility shims
- Mix old and new patterns

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Cleanup task
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 5 (final)
- **Blocks**: None (final task)
- **Blocked By**: Task 8

**References**:

**Pattern References**:
- `src/index.ts` barrel file

**Acceptance Criteria**:

```bash
# Full build:
bun run build
# Assert: No errors, no warnings

# Verify no old exports:
bun -e "
import * as pkg from './src';
const exports = Object.keys(pkg);
console.log('Exports:', exports.join(', '));
const banned = ['createSubscription', 'verifySubscription', 'cancelSubscription'];
const found = banned.filter(b => exports.includes(b));
if (found.length) {
  console.log('ERROR: Old exports found:', found);
  process.exit(1);
}
console.log('PASS: No old exports');
"
# Assert: Output ends with "PASS: No old exports"

# Integration smoke test:
bun -e "
import { paymongo } from './src/server';
import { paymongoClient } from './src/client';
import { useCheck, useSubscription } from './src/react';

const plugin = paymongo({
  secretKey: 'sk_test_xxx',
  plans: {
    pro: { amount: 9900, currency: 'PHP', displayName: 'Pro Plan', interval: 'monthly' }
  },
  features: {
    api_calls: { type: 'metered', limit: 1000 },
    premium_access: { type: 'boolean' }
  }
});

console.log('Plugin ID:', plugin.id);
console.log('Schema keys:', Object.keys(plugin.schema || {}));
console.log('Endpoints:', plugin.endpoints?.length || 0);
console.log('PASS: Integration test');
"
# Assert: Outputs plugin ID, schema keys include paymongoUsage, endpoints > 0
```

**Evidence to Capture:**
- [x] Build output
- [x] Export verification
- [x] Integration smoke test output

**Commit**: YES
- Message: `refactor: complete migration to autumn-style architecture`
- Files: `src/index.ts`, `src/server.ts`, `src/client.ts`, `src/react.ts`, `src/types.ts`
- Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(types): define autumn-style type system` | types.ts | bun run build |
| 2 | `feat(schema): add paymongoUsage table for metering` | server.ts | bun run build |
| 3 | `feat(endpoints): implement /attach for checkout sessions` | server.ts | bun run build |
| 4 | `feat(cache): add 60s TTL in-memory cache layer` | cache.ts | bun run build |
| 5 | `feat(endpoints): implement /check with caching and period rollover` | server.ts | bun run build |
| 6 | `feat(endpoints): implement /track for usage metering` | server.ts | bun run build |
| 7 | `feat(client): autumn-style client with attach/check/track actions` | client.ts | bun run build |
| 8 | `feat(react): add useCheck and useSubscription hooks` | react.ts | bun run build |
| 9 | `refactor: complete migration to autumn-style architecture` | all src/* | bun run build |

---

## Success Criteria

### Verification Commands
```bash
# Full build passes:
bun run build
# Expected: No errors

# All endpoints accessible:
curl http://localhost:3000/api/auth/paymongo/check?feature=test
# Expected: 401 or valid response (not 404)

curl -X POST http://localhost:3000/api/auth/paymongo/attach -d '{}'
# Expected: 401 or validation error (not 404)

curl -X POST http://localhost:3000/api/auth/paymongo/track -d '{}'
# Expected: 401 or validation error (not 404)
```

### Final Checklist
- [x] All 3 Autumn endpoints work (/attach, /check, /track)
- [x] Usage table created on DB init
- [x] 60s caching working (measurable speedup on /check)
- [x] Period rollover resets balance lazily
- [x] Client actions work (attach, check, track)
- [x] React hooks work (useCheck, useSubscription)
- [x] No old endpoints remain
- [x] No webhook code exists
- [x] Build passes with no errors
