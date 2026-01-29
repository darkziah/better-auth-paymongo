
## Types Rewrite - Autumn Pattern

Completed full rewrite of `src/types.ts` following Autumn billing pattern:

### Core Type Structure
- `FeatureConfig`: Discriminated union `{ type: 'boolean' }` | `{ type: 'metered'; limit: number }`
- `PlanConfig`: Single plan with `features: Record<string, boolean | number>`
  - Boolean features: `true` = enabled
  - Metered features: `number` = limit override
- `PaymongoAutumnConfig<TPlans, TFeatures>`: Generic config for type inference
  - Includes `scopes?: Array<'user' | 'organization'>` for dual billing

### API Response Types
- `AttachResponse`: `{ checkoutUrl, sessionId }` - for /attach endpoint
- `CheckResponse`: `{ allowed, balance?, limit?, planId? }` - for /check endpoint  
- `TrackResponse`: `{ success, balance, limit }` - for /track endpoint

### Database Types
- `UsageRecord`: Full DB row type with all fields (id, entityType, entityId, featureId, balance, limit, periodStart, periodEnd, planId, checkoutSessionId, timestamps)

### Removed Patterns
- ❌ Old subscription-centric types (SubscriptionData, etc.)
- ❌ Add-on types (BaseAddonConfig) - excluded from scope
- ❌ Trial types (trialPeriodDays) - excluded from scope
- ❌ Lifecycle hooks - excluded from Autumn pattern
- ❌ Default plan config - excluded from scope

### Next Steps
Other files (client.ts, server.ts, react.ts) still reference old types and will need updates.

## Task 3: Implement /attach Endpoint

### Implementation Details
- Successfully created `POST /paymongo/attach` endpoint using better-auth's `createAuthEndpoint` and `sessionMiddleware`
- Import path for better-auth API utilities: `better-auth/api` (not `@better-auth/core/api`)
- PayMongo Checkout Sessions API requires:
  - Basic authentication with secret key (base64 encoded as `sk_xxx:`)
  - Line items with name, amount, currency, quantity
  - Payment method types: card, gcash, grab_pay
  - Success/cancel URLs for redirect
  - Billing email from authenticated user

### Usage Record Creation
- Created helper `paymongoFetch` function for authenticated PayMongo API calls
- Usage records are created ONLY for metered features (boolean features don't need tracking)
- Period end calculated based on plan interval: +1 month for monthly, +12 months for yearly
- Initial balance set to the limit value from plan config
- Checkout session ID stored for later verification in /check endpoint

### Better-Auth Patterns
- `ctx.context.session.user` provides authenticated user info
- `ctx.context.adapter.create()` for database operations
- `ctx.json<Type>()` for typed JSON responses
- `sessionMiddleware` handles authentication automatically

### Build System
- JS build (`bun run build:js`) succeeds independently
- TypeScript declaration build fails due to old client.ts/react.ts files (will be replaced in Tasks 7-8)
- This is expected and acceptable for Task 3 completion
