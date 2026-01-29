# better-auth-paymongo Example

TanStack Start example with Bun SQLite database demonstrating the PayMongo billing plugin.

## Features

- 🚀 TanStack Start (TanStack Router + Vinxi)
- 🗄️ Bun SQLite for local database
- 💳 PayMongo integration
- 🎨 Tailwind CSS v4

## Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your PayMongo secret key:
   ```
   PAYMONGO_SECRET_KEY=sk_test_your_key_here
   BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Run development server**
   ```bash
   bun run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Pages

- `/` - Home page with links
- `/pricing` - Pricing page with plan selection
- `/billing` - Billing dashboard with usage meters

## Testing

Run the integration tests:

```bash
bun test
```

## Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Better-Auth server config
│   └── auth-client.ts   # Better-Auth client config
├── routes/
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home page
│   ├── pricing.tsx      # Pricing page
│   ├── billing.tsx      # Billing dashboard
│   └── api/
│       └── auth/
│           └── $.ts     # Better-Auth catch-all handler
├── router.tsx           # TanStack Router config
├── entry-client.tsx     # Client entry
└── entry-server.tsx     # Server entry
```

## PayMongo Configuration

The example configures three plans:

| Plan | Price | Projects | API Calls | PDF Export | Priority Support |
|------|-------|----------|-----------|------------|------------------|
| Free | ₱0 | 3 | 100 | ❌ | ❌ |
| Starter | ₱499 | 10 | 1,000 | ✅ | ❌ |
| Pro | ₱999 | 100 | 10,000 | ✅ | ✅ |
