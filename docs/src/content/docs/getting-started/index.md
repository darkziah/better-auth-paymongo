---
title: "Installation"
description: "How to install better-auth-paymongo in your project."
---

Install the package using your preferred package manager:

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="npm">
    ```bash
    npm install better-auth-paymongo
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```bash
    pnpm add better-auth-paymongo
    ```
  </TabItem>
  <TabItem label="yarn">
    ```bash
    yarn add better-auth-paymongo
    ```
  </TabItem>
  <TabItem label="bun">
    ```bash
    bun add better-auth-paymongo
    ```
  </TabItem>
</Tabs>

## Peer Dependencies

Ensure you have the following peer dependencies installed:

- `better-auth` >= 1.0.0
- `zod` >= 3.0.0
- `react` >= 18.0.0 (Optional, only for React components/hooks)

## Database Migration

This plugin adds several tables to your database to manage subscriptions and payments. After configuring the plugin, you'll need to run your database migrations.

If you are using `better-auth`'s built-in migration tool:

```bash
npx better-auth migrate
```

Alternatively, you can generate the schema and handle migrations manually according to your database provider.
