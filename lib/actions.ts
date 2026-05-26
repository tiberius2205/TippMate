"use server";

import { createClient } from "@/lib/supabase/server";

// ─── User ────────────────────────────────────────────────────────────────────

export async function createUser(nickname: string): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .insert({ nickname: nickname.trim() })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function getUser(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data;
}

// ─── Tipprunden ──────────────────────────────────────────────────────────────

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createGroup(
  name: string,
  userId: string,
  alias: string
): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient();

  // Einzigartigen Code generieren
  let code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = randomCode();
    const { data } = await supabase.from("groups").select("id").eq("code", candidate).single();
    if (!data) {
      code = candidate;
      break;
    }
  }
  if (!code) return { error: "Konnte keinen einzigartigen Code generieren." };

  const { data, error } = await supabase
    .from("groups")
    .insert({ code, name: name.trim(), created_by: userId })
    .select("id, code")
    .single();

  if (error) return { error: error.message };

  // Ersteller sofort als Mitglied hinzufügen
  await supabase
    .from("group_members")
    .insert({ group_id: data.id, user_id: userId, alias: alias.trim() });

  return { code: data.code };
}

export async function joinGroup(
  code: string,
  userId: string,
  alias: string
): Promise<{ success: true; groupName: string } | { error: string }> {
  const supabase = await createClient();

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name")
    .eq("code", code.toUpperCase())
    .single();

  if (gErr || !group) return { error: "Tipprunde nicht gefunden." };

  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existing) return { error: "Du bist bereits Mitglied dieser Runde." };

  const { error: mErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, alias: alias.trim() });

  if (mErr) return { error: mErr.message };
  return { success: true, groupName: group.name };
}

export async function getGroupByCode(code: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*, group_members(user_id, users(nickname))")
    .eq("code", code.toUpperCase())
    .single();
  return data;
}

export async function lookupGroup(
  code: string
): Promise<{ name: string; memberCount: number } | { error: string }> {
  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("groups")
    .select("name, group_members(user_id)")
    .eq("code", code.toUpperCase())
    .single();
  if (error || !group) return { error: "Tipprunde nicht gefunden." };
  return {
    name: group.name,
    memberCount: (group.group_members as Array<{ user_id: string }>).length,
  };
}

export async function getMyGroups(
  userId: string
): Promise<Array<{ code: string; name: string; alias: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("alias, groups(code, name)")
    .eq("user_id", userId);
  return (data ?? []).map((m) => {
    const g = m.groups as unknown as { code: string; name: string };
    return { alias: m.alias, code: g.code, name: g.name };
  });
}
