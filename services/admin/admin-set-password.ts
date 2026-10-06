import { logAdminAction } from "@/services/admin/admin-audit-store";
import { hashPassword } from "@/services/auth/password.service";
import { setUserPassword } from "@/services/auth/user-store";
import type { UserProfile } from "@/types";

export { parseNewPasswordPair as parseAdminNewPassword } from "@/shared/utils/password-rules";

export async function applyAdminSetPassword(input: {
  actor: Pick<UserProfile, "id" | "fullName">;
  targetId: string;
  password: string;
}): Promise<UserProfile> {
  const user = await setUserPassword(input.targetId, hashPassword(input.password));
  await logAdminAction({
    actorId: input.actor.id,
    actorName: input.actor.fullName,
    action: "user_update",
    targetType: "user",
    targetId: input.targetId,
    detail:
      input.actor.id === input.targetId
        ? "تغيير كلمة مرور المدير من لوحة التحكم"
        : "تعيين كلمة مرور من لوحة التحكم",
  });
  return user;
}
