# Specification: Plugin Configuration & Types

## ADDED Requirements

### Requirement: Generic Plan Configuration
The plugin MUST accept a strictly typed dictionary of Plans.

#### Scenario: Defining a user plan
```typescript
const plans = {
  basic: {
    id: "basic",
    price: 500,
    scope: "user",
    features: ["feature-a"],
    limits: { projects: 5 }
  }
}
// Plugin should infer PlanId = "basic"
```

#### Scenario: Defining an organization plan
```typescript
const plans = {
  team: {
    id: "team",
    price: 2000,
    scope: "organization",
    limits: { seats: 10 }
  }
}
```

### Requirement: Generic Add-on Configuration
The plugin MUST accept a strictly typed dictionary of Add-ons.

#### Scenario: Quantity-based add-on
```typescript
const addons = {
  extraSeat: {
    id: "extraSeat",
    type: "quantity",
    price: 100,
    affectsLimit: "seats"
  }
}
```

#### Scenario: Feature-based add-on
```typescript
const addons = {
  prioritySupport: {
    id: "prioritySupport",
    type: "feature",
    price: 500
  }
}
```

### Requirement: Type Inference
The Client plugin MUST infer valid Plan IDs and Add-on IDs from the Server configuration.

#### Scenario: Client autocomplete
Given the config above, `client.paymongo.createSubscription({ planId: "..." })` should allow "basic" or "team" but reject "unknown".
