# Fextiva Ticket Redirect (`t.fextiva.com`)

Ultra-fast edge redirect service for short ticket links.

When attendees click or tap:
`t.fextiva.com/E7K2M-9M4P10`

They are instantly redirected (HTTP 302, <15ms latency) to:
`https://fextiva.com/ticket/view?code=E7K2M-9M4P10`

---

## Deployment Options

### Option 1: Deploy to Vercel
1. Import this folder (`workers/ticket-redirect`) into Vercel as a new project, or run from terminal:
   ```bash
   cd workers/ticket-redirect
   npx vercel
   ```
2. In your Vercel Project Settings -> **Domains**, add:
   `t.fextiva.com`
3. Add a CNAME in your DNS (Cloudflare / Namecheap / GoDaddy):
   * Type: `CNAME`
   * Name: `t`
   * Value: `cname.vercel-dns.com`

---

### Option 2: Deploy to Cloudflare Workers
1. From the repo root, run:
   ```bash
   pnpm deploy:worker:redirect
   ```
2. In Cloudflare Workers Dashboard:
   * Go to **Settings** -> **Domains & Routes** -> **Custom Domains**.
   * Add: `t.fextiva.com`. Cloudflare will automatically set up the SSL certificate and DNS route.

