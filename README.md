# td-like

Next.js App Router starter with Tailwind, shadcn/ui, React Three Fiber, and Supabase email/password auth.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` from your [Supabase](https://supabase.com/dashboard) project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is the same value as the anon key in most dashboards. `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works as a fallback.

In the Supabase dashboard, enable **Email** auth (Authentication → Providers). Leave “Confirm email” on unless you want users to skip the confirmation step.

Add these redirect URLs under Authentication → URL Configuration:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/callback`

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page loads a 3D canvas. `/play` is protected and redirects to `/login` when you are signed out.

Node 22+ is recommended (`@supabase/supabase-js` lists it as the engine).
