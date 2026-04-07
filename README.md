This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Redis SSE (Realtime transactions)

Set one of these environment options before running `npm run dev`:

1. Preferred:
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Shortcut:
   `UPSTASH_REDIS_CONNECTION` with format:
   `fleet-bullfrog-89651.upstash.io:6379,password=<token>,ssl=True,abortConnect=False`

Optional stream tuning:

1. `TRANSACTIONS_STREAM_KEY` (default: `fraud:tx:stream`)
2. `TRANSACTIONS_STREAM_BLOCK_MS` (default: `15000`)
3. `TRANSACTIONS_STREAM_READ_COUNT` (default: `20`)

Optional snapshot sources for initial table load (priority: Stream -> JSON keys -> List keys -> KV keys):

1. `TRANSACTIONS_JSON_KEYS` (default: `fraud:transactions,transactions,tx:list`)
2. `TRANSACTIONS_LIST_KEYS` (default: `fraud_queue`)
3. `TRANSACTIONS_KV_PATTERNS` (default: `alert:fraud:*,TXN-*,tx:*,transaction:*`)
4. `TRANSACTIONS_SCAN_COUNT` (default: `200`)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

