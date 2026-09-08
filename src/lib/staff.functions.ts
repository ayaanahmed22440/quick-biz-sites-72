import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const inviteSchema = z.object({
  email: z.string().trim().email().max(255),
  role: z.enum(["admin", "staff"]),
});

async function requireAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Administrator access required");
}

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles, error: rolesError }, { data: invitations, error: invitationsError }] =
      await Promise.all([
        supabaseAdmin
          .from("user_roles")
          .select("user_id, role, created_at")
          .in("role", ["admin", "staff"])
          .order("created_at"),
        supabaseAdmin
          .from("staff_invitations")
          .select("id, email, role, created_at, expires_at, accepted_at")
          .order("created_at", { ascending: false }),
      ]);

    if (rolesError) throw rolesError;
    if (invitationsError) throw invitationsError;

    const userIds = (roles ?? []).map((item) => item.user_id);
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return {
      members: (roles ?? []).map((item) => ({
        userId: item.user_id,
        role: item.role,
        createdAt: item.created_at,
        email: profileById.get(item.user_id)?.email ?? "Account email unavailable",
        name: profileById.get(item.user_id)?.full_name ?? null,
      })),
      invitations: invitations ?? [],
    };
  });

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    let invitedUserId = existingProfile?.id;
    if (!invitedUserId) {
      const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: process.env["APP_URL"] ?? "https://webwarheads.com" },
      );
      if (inviteError) throw new Error(inviteError.message);
      invitedUserId = invite.user.id;
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: invitedUserId, role: data.role },
      { onConflict: "user_id,role" },
    );
    if (roleError) throw roleError;

    await supabaseAdmin
      .from("staff_invitations")
      .delete()
      .ilike("email", email)
      .is("accepted_at", null);

    const { error: invitationError } = await supabaseAdmin.from("staff_invitations").insert({
      email,
      role: data.role,
      invited_by: context.userId,
      accepted_at: existingProfile ? new Date().toISOString() : null,
    });
    if (invitationError) throw invitationError;

    return { invited: !existingProfile };
  });