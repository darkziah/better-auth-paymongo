---
title: "Server Plugin"
description: "API reference for the paymongo() server plugin"
---

### Overview
- `paymongo(config)` - Better-Auth server plugin
- Registers 3 HTTP endpoints under `/api/auth/paymongo/`
- Creates `paymongoUsage` database table

### Endpoints

**POST /api/auth/paymongo/attach**
```typescript
// Request body
{
  planId: string;
  successUrl: string;
  cancelUrl: string;
  organizationId?: string;
}

// Response
{
  checkoutUrl: string;  // Redirect user here
  sessionId: string;    // PayMongo checkout session ID
}
```
- Creates PayMongo checkout session
- Initializes usage records in DB
- User must complete payment at checkoutUrl

**GET /api/auth/paymongo/check**
```typescript
// Query params
?feature=feature_id&organizationId=org_id

// Response
{
  allowed: boolean;
  balance?: number;   // For metered features
  limit?: number;     // For metered features
  planId?: string;
}
```
- Checks if feature access is allowed
- Validates PayMongo payment status (cached 60s)
- Handles billing period rollover automatically

**POST /api/auth/paymongo/track**
```typescript
// Request body
{
  feature: string;
  delta?: number;       // Default: 1
  organizationId?: string;
}

// Response
{
  success: boolean;
  balance: number;
  limit: number;
}
```
- Decrements usage balance for metered features
- Returns updated balance

### Error Responses
```typescript
// 401 Unauthorized - No session
{ error: "Unauthorized" }

// 400 Bad Request - Invalid params
{ error: "Missing required field: planId" }

// 403 Forbidden - Limit exceeded
{ allowed: false, balance: 0, limit: 100 }
```

### Database Schema
Table: `paymongoUsage`
| Field | Type | Description |
|-------|------|-------------|
| entityType | string | "user" or "organization" |
| entityId | string | User/org ID |
| featureId | string | Feature being tracked |
| balance | number | Remaining usage |
| limit | number | Max usage per period |
| periodStart | date | Current billing cycle start |
| periodEnd | date | Current billing cycle end |
| planId | string | Associated plan |
| checkoutSessionId | string | PayMongo session ID |
