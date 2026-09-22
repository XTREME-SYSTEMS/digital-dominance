# SMAI → Vercel + Supabase Migration Brief for GPT

Paste this entire document into ChatGPT (or Claude) to have it rewrite the frontend code.

---

## Context

I'm migrating the **Strategic Minds AI (SMAI)** website from a Base44 app to a standalone Vercel + Supabase deployment. The Vercel repo already has the frontend (React + Vite + Tailwind + React Router). I need to replace all Base44 SDK calls with Supabase calls.

**Supabase project:** `https://vgsmyhqqtkkluhypxyua.supabase.co`
**Vercel env vars already set:** `VITE_SMAI_SUPABASE_URL`, `VITE_SMAI_SUPABASE_ANON_KEY`

## What's already done

1. Supabase schema is deployed (tables: `profiles`, `projects`, `leads`, `messages` with RLS)
2. The Supabase client helper exists at `src/lib/smaiSupabase.js` (see below)
3. `@supabase/supabase-js` is installed

## What GPT needs to do

### 1. Create `src/lib/smaiSupabase.js` (already written — just verify it's there)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SMAI_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SMAI_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { ...user, ...profile };
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
}

export async function signOut() { return supabase.auth.signOut(); }

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function getMyProjects() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("projects").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function getAllProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function getLeads() {
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function submitLead(leadData) {
  const { data, error } = await supabase.from("leads").insert([leadData]).select().single();
  if (error) throw error;
  return data;
}

export async function sendMessage(body) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase.from("messages").insert([{ client_id: user.id, body }]).select().single();
  if (error) throw error;
  return data;
}

export async function getMyMessages() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("messages").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}
```

### 2. Create `src/context/AuthContext.jsx`

Create a React auth context that wraps the app, listens to `supabase.auth.onAuthStateChange`, and exposes `{ user, loading, signIn, signUp, signOut }`. The `user` object should include the `role` from the `profiles` table (merge profile data). On signup, call `signUp` then auto-sign-in. On state change, fetch the profile and set user.

### 3. Rewrite `src/pages/smai/ClientPortal.jsx`

**Original (Base44 version):**
- Uses `base44.auth.me()` for current user
- Uses `base44.entities.ClientProject.filter({ created_by_id: user.id })` for projects
- Uses `base44.integrations.Core.SendEmail()` for messages

**New version should:**
- Use `useAuth()` from the new AuthContext instead of `base44.auth.me()`
- Use `getMyProjects()` from `smaiSupabase.js` instead of `base44.entities.ClientProject`
- Use `sendMessage(msg)` from `smaiSupabase.js` instead of `SendEmail`
- Use `getMyMessages()` to show message history
- Keep the same visual design (electric blue theme, stone-950 bg, same layout)
- If not logged in, show login prompt linking to `/login`
- Field mapping: `p.name` → `p.name`, `p.status` → `p.status`, `p.description` → `p.description`, `p.created_date` → `p.created_at`

### 4. Rewrite `src/pages/smai/AdminPortal.jsx`

**Original (Base44 version):**
- Uses `base44.auth.me()` and checks `user.role === "admin"`
- Uses `base44.entities.Lead.list()` for leads
- Uses `base44.entities.ClientProject.list()` for projects

**New version should:**
- Use `useAuth()` and check `user?.role === "admin"`
- Use `getLeads()` and `getAllProjects()` from `smaiSupabase.js`
- Keep the same visual design
- Remove links to `/admin/*` routes (those are Base44 admin pages that don't exist on Vercel)
- Field mapping: `l.first_name` → `l.first_name`, `l.status` → `l.status`, `l.email` → `l.email`, `l.estimate_mid` → `l.estimate_value`

### 5. Rewrite `src/pages/smai/Contact.jsx`

Replace any `base44.entities.Lead.create()` or `base44.integrations.Core.SendEmail()` with `submitLead()` from `smaiSupabase.js`. The contact form should insert into the `leads` table with fields: `first_name`, `last_name`, `email`, `phone`, `company`, `service_interest`, `message`.

### 6. Create `src/pages/smai/Login.jsx` and `src/pages/smai/Register.jsx`

Simple auth pages using Supabase:
- Login: email + password → `signIn()` → redirect to `/smai/portal`
- Register: name + email + password → `signUp()` → redirect to `/smai/portal`
- Use the same electric blue theme as the rest of SMAI
- Include `SmaiNav` and `SmaiFooter`

### 7. Update `src/App.jsx` router

- Remove ALL routes that aren't SMAI or auth (the epoxy/admin routes don't exist on Vercel)
- Keep only: `/smai`, `/smai/services`, `/smai/about`, `/smai/case-studies`, `/smai/contact`, `/smai/login`, `/smai/register`, `/smai/portal` (protected), `/smai/admin-portal` (protected, admin only)
- Add a ProtectedRoute component that checks `useAuth()` and redirects to `/smai/login`
- The admin portal route should check `user?.role === "admin"`
- Redirect `/` to `/smai`

### 8. Remove Base44 dependencies

- Remove `import { base44 } from "@/api/base44Client"` from all SMAI files
- Remove `@base44/sdk` and `@base44/vite-plugin` from package.json
- Remove any `base44.config.jsonc` or Base44-specific config files
- Remove the `src/api/base44Client.js` file
- Remove `src/components/codestudio/CodeInjector.jsx` and its usage

## Design system (keep consistent)

- Background: `bg-stone-950`
- Primary gradient: `electric-bg` class (cyan #00E5FF → blue #2196F3 → dark blue #0040CC)
- Text: white on dark, stone-400 for muted
- Accent: cyan-400
- Font: Plus Jakarta Sans (heading), Inter (body) — already in index.css
- Glow: `electric-glow` class

## Instructions for GPT

1. Output each file as a complete, ready-to-paste code block with the file path as a header
2. Don't add any new dependencies beyond `@supabase/supabase-js` (already installed)
3. Keep all visual styling identical — only change the data layer
4. Use React Router v6 patterns (`useNavigate`, `<Link>`, `<Routes>`)
5. Use `@tanstack/react-query` for data fetching (already installed)
6. Don't create a backend — everything runs client-side with Supabase RLS