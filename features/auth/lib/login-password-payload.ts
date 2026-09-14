/**
 * Request body for POST /api/auth/login/password.
 * JSON `next: null` 400s on `z.string().optional()` — omit the field when absent.
 */
export type LoginPasswordPayload = {
  email: string;
  password: string;
  next?: string;
};

export function buildLoginPasswordPayload(input: {
  email: string;
  password: string;
  next?: string | null;
}): LoginPasswordPayload {
  const payload: LoginPasswordPayload = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
  const next = input.next?.trim();
  if (next) payload.next = next;
  return payload;
}
