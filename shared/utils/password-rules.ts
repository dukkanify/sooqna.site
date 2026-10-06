export function isStrongPassword(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value.trim());
}

export const STRONG_PASSWORD_HINT =
  "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وصغير ورقم.";

export function parseNewPasswordPair(body: {
  confirmPassword?: unknown;
  newPassword?: unknown;
}): { password: string } | { error: string; message: string } {
  const password = String(body.newPassword ?? "").trim();
  const confirm =
    body.confirmPassword === undefined || body.confirmPassword === null
      ? password
      : String(body.confirmPassword).trim();

  if (!isStrongPassword(password)) {
    return { error: "WEAK_PASSWORD", message: STRONG_PASSWORD_HINT };
  }
  if (confirm !== password) {
    return {
      error: "PASSWORD_MISMATCH",
      message: "كلمة المرور وتأكيدها غير متطابقين.",
    };
  }
  return { password };
}
