/**
 * Supabase client for Strategic Minds AI (Vercel frontend)
 *
 * In the Vercel project, install: npm install @supabase/supabase-js
 * Then set these env vars in Vercel:
 *   VITE_SMAI_SUPABASE_URL=https://vgsmyhqqtkkluhypxyua.supabase.co
 *   VITE_SMAI_SUPABASE_ANON_KEY=your-anon-key
 *
 * Copy this file to src/lib/smaiSupabase.js in the Vercel repo.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SMAI_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SMAI_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[SMAI] Missing Supabase env vars. Set VITE_SMAI_SUPABASE_URL and VITE_SMAI_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// === Auth helpers ===

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { ...user, ...profile };
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

// === Data helpers ===

export async function getMyProjects() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("[SMAI] getMyProjects:", error); return []; }
  return data || [];
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[SMAI] getAllProjects:", error); return []; }
  return data || [];
}

export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[SMAI] getLeads:", error); return []; }
  return data || [];
}

export async function submitLead(leadData) {
  const { data, error } = await supabase
    .from("leads")
    .insert([leadData])
    .select()
    .single();
  if (error) { console.error("[SMAI] submitLead:", error); throw error; }
  return data;
}

export async function sendMessage(body) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("messages")
    .insert([{ client_id: user.id, body }])
    .select()
    .single();
  if (error) { console.error("[SMAI] sendMessage:", error); throw error; }
  return data;
}

export async function getMyMessages() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("[SMAI] getMyMessages:", error); return []; }
  return data || [];
}