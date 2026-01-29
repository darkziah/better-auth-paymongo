# Seat-Based Organization Billing

## TL;DR

> **Quick Summary**: Add automatic seat-based billing integration with Better-Auth's organization plugin. When a plan includes a "seats" feature, the plugin auto-enforces member limits and tracks seat usage.
> 
> **Deliverables**:
> - New `src/organization.ts` with seat integration helpers
> - `createPaymongoOrganization()` function for auto-integration
> - `createSeatLimit()` for dynamic membership limits
> - Updated exports and documentation
> 
> **Estimated Effort**: Small (1-2 hours)
> **Parallel Execution**: NO - sequential
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
Add seat-based organization billing so that when an organization pays for a Pro plan with 5 seats, only 5 members can join.

### Research Findings
- Better-Auth has built-in `membershipLimit` option that accepts a number or async function
- Better-Auth has `organizationHooks` for lifecycle events (beforeAddMember, afterAddMember, etc.)
- Our current plugin tracks metered features with balance/limit - seats fit this model perfectly

### Integration Approach
1. Export helper functions that users pass to Better-Auth's organization plugin
2. `membershipLimit` queries our `paymongoUsage` table for the "seats" feature limit
3. Seats are just a metered feature - no special DB schema needed

---

## Work Objectives

### Core Objective
Allow organizations to have seat-limited plans where the number of members is enforced automatically.

### Concrete Deliverables
- `src/organization.ts` - New file with seat integration
- Updated `src/index.ts` - Export new functions
- Updated `README.md` - Document seat-based billing

### Definition of Done
- [x] `createPaymongoOrganization()` function exported
- [x] `createSeatLimit()` function exported  
- [x] `getOrganizationSeats()` helper exported
- [x] README has seat-based billing section
- [x] Build passes

### Must Have
- Dynamic seat limits from billing data
- Integration with Better-Auth organization plugin
- Documentation with usage examples

### Must NOT Have (Guardrails)
- ❌ No auto-decrement on member add (Better-Auth handles limits)
- ❌ No webhook handlers
- ❌ No changes to core server.ts endpoints

---

## TODOs

---

### Task 1: Create organization.ts with seat helpers

**What to do**:
- Create `src/organization.ts`
- Export `createPaymongoOrganization(config, seatConfig?)` - returns object with `membershipLimit` and `organizationHooks`
- Export `createSeatLimit(adapter, options?)` - returns dynamic limit function
- Export `getOrganizationSeats(adapter, orgId)` - returns `{ used, limit, remaining }`

**Must NOT do**:
- ❌ Don't modify server.ts
- ❌ Don't add new database tables

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: [`brainstorming`]

**References**:
- `src/server.ts` - For adapter pattern and UsageRecord type
- `src/types.ts` - For PaymongoAutumnConfig type

**Acceptance Criteria**:
```bash
bun run build
# Assert: No errors

bun -e "import { createPaymongoOrganization, createSeatLimit, getOrganizationSeats } from './src/organization'; console.log('PASS')"
# Assert: Outputs "PASS"
```

**Commit**: YES
- Message: `feat(organization): add seat-based billing integration`
- Files: `src/organization.ts`

---

### Task 2: Update index.ts exports

**What to do**:
- Add exports for `createPaymongoOrganization`, `createSeatLimit`, `getOrganizationSeats`
- Export `SeatConfig` type

**Acceptance Criteria**:
```bash
bun -e "import { createPaymongoOrganization } from './src'; console.log('PASS')"
# Assert: Outputs "PASS"
```

**Commit**: YES
- Message: `feat(exports): add organization seat helpers`
- Files: `src/index.ts`

---

### Task 3: Update README with seat documentation

**What to do**:
- Add "Seat-Based Organization Billing" section
- Show example configuration with seats feature
- Show integration with Better-Auth organization plugin
- Document `createPaymongoOrganization()` and `createSeatLimit()`

**Example to add**:
```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { paymongo, createPaymongoOrganization } from "better-auth-paymongo";

const paymongoConfig = {
  secretKey: process.env.PAYMONGO_SECRET_KEY!,
  features: {
    seats: { type: "metered", limit: 5 },
    projects: { type: "metered", limit: 10 },
  },
  plans: {
    starter: {
      amount: 49900,
      currency: "PHP",
      displayName: "Starter",
      interval: "monthly",
      features: { seats: 5, projects: 10 },
    },
    pro: {
      amount: 99900,
      currency: "PHP",
      displayName: "Pro", 
      interval: "monthly",
      features: { seats: 25, projects: 50 },
    },
  },
};

export const auth = betterAuth({
  plugins: [
    paymongo(paymongoConfig),
    organization({
      // Auto-integrate seat limits with billing
      ...createPaymongoOrganization(paymongoConfig),
    }),
  ],
});
```

**Commit**: YES
- Message: `docs: add seat-based organization billing guide`
- Files: `README.md`

---

## Success Criteria

### Verification Commands
```bash
# Build passes
bun run build

# All exports work
bun -e "
import { paymongo, createPaymongoOrganization, createSeatLimit, getOrganizationSeats } from './src';
console.log('paymongo:', typeof paymongo);
console.log('createPaymongoOrganization:', typeof createPaymongoOrganization);
console.log('createSeatLimit:', typeof createSeatLimit);
console.log('getOrganizationSeats:', typeof getOrganizationSeats);
"
```

### Final Checklist
- [x] organization.ts created with seat helpers
- [x] All helpers exported from index.ts
- [x] README has seat documentation
- [x] Build passes with no errors
