# Better Auth PayMongo - Next.js Example

A complete Next.js 15 example demonstrating PayMongo billing integration with Better Auth using the Autumn pattern.

## Features

- **Pricing Page** - Plan selection with checkout flow
- **Billing Dashboard** - Usage meters and feature access status
- **SQLite Database** - Local development with better-sqlite3

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Add your PayMongo API keys to `.env.local`

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts  # Better-Auth API handler
│   ├── billing/page.tsx            # Usage dashboard
│   ├── pricing/page.tsx            # Plan selection
│   ├── page.tsx                    # Home page
│   └── layout.tsx                  # Root layout
└── lib/
    ├── auth.ts                     # Server-side auth config
    └── auth-client.ts              # Client-side auth
```

## Plans Configuration

| Plan | Price | Projects | Storage | API Calls | Priority Support |
|------|-------|----------|---------|-----------|------------------|
| Free | ₱0/mo | 3 | 100 MB | 100/mo | ❌ |
| Pro | ₱999/mo | 25 | 10 GB | 10,000/mo | ❌ |
| Enterprise | ₱4,999/mo | 1000 | 100 GB | 100,000/mo | ✅ |

## Running Tests

```bash
bun test
```
