# Database Connection - postgres.js

## Overview
The project uses **postgres.js** (also known as `postgres`) for PostgreSQL connections. This is a fast, modern PostgreSQL client optimized for serverless and edge environments.

## Why postgres.js over pg?

✅ **Faster** - Up to 2x faster than `pg`
✅ **Smaller** - Lighter bundle size
✅ **Modern API** - Promise-based, clean syntax
✅ **Better TypeScript** - Superior type inference
✅ **Serverless-friendly** - Optimized for edge/serverless
✅ **Auto-reconnection** - Built-in resilience
✅ **Connection pooling** - Automatic management

## Configuration

### File: `/src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### Dependencies

```json
{
  "dependencies": {
    "postgres": "^3.4.8",
    "drizzle-orm": "^0.45.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8"
  }
}
```

## Usage Examples

### Basic Query
```typescript
import { db } from "@/db";
import { items } from "@/db/schema";

// Select all items
const allItems = await db.select().from(items);

// Insert item
const [newItem] = await db.insert(items).values({
  sellerId: "...",
  name: "محصول جدید",
  price: "50000",
}).returning();
```

### With Relations
```typescript
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

const orderWithItems = await db.query.orders.findFirst({
  where: eq(orders.id, orderId),
  with: {
    orderItems: {
      with: {
        item: true,
      },
    },
  },
});
```

### Transactions
```typescript
import { db } from "@/db";

await db.transaction(async (tx) => {
  const order = await tx.insert(orders).values({...});
  const orderItem = await tx.insert(orderItems).values({...});
  return { order, orderItem };
});
```

## Environment Variables

Add to `.env` or `.env.local`:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

For Supabase:
```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Connection Pooling

postgres.js handles connection pooling automatically. Default settings:

- **Max connections**: 10
- **Idle timeout**: 0 (no timeout)
- **Connection timeout**: 30s

### Custom Configuration (Optional)

```typescript
const client = postgres(process.env.DATABASE_URL!, {
  max: 20, // Max connections
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Timeout connection attempts after 10s
});
```

## Drizzle Kit

Push schema changes:
```bash
pnpm exec drizzle-kit push
```

Generate migrations:
```bash
pnpm exec drizzle-kit generate
```

Run migrations:
```bash
pnpm exec drizzle-kit migrate
```

## Performance Benefits

| Feature | pg | postgres.js |
|---------|-----|-------------|
| Speed | Baseline | **~2x faster** |
| Bundle Size | ~100KB | **~40KB** |
| TypeScript | Basic | **Excellent** |
| Serverless | ⚠️ Requires tuning | ✅ Optimized |
| API Style | Callback/Promise | **Promise-only** |
| Connection Pooling | Manual setup | **Automatic** |

## Troubleshooting

### Connection Issues
```typescript
// Test connection
import { db } from "@/db";
await db.execute`SELECT 1`;
console.log("Connected!");
```

### SSL Requirements
For production (like Supabase with SSL):
```typescript
const client = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
});
```

### Debugging
Enable query logging:
```typescript
const client = postgres(process.env.DATABASE_URL!, {
  debug: (conn, query, params) => {
    console.log({ conn, query, params });
  },
});
```

## Migration from pg

If migrating from `pg`, the changes are minimal:

**Before (pg):**
```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

**After (postgres.js):**
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

## Resources

- [postgres.js Documentation](https://github.com/porsager/postgres)
- [Drizzle ORM with postgres.js](https://orm.drizzle.team/docs/get-started-postgresql#postgres-js)
- [Performance Benchmarks](https://github.com/porsager/postgres#performance)
