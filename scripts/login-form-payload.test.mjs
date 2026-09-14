/**
 * LoginForm submission-path tests.
 * The P0 bug was JSON `next: null` from URLSearchParams.get("next"),
 * which Zod `z.string().optional()` rejects as INVALID_INPUT.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { buildLoginPasswordPayload } from "../features/auth/lib/login-password-payload.ts";
import { optionalRedirectPathSchema } from "../shared/utils/safe-next.ts";

const apiLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: optionalRedirectPathSchema,
});

const legacyNextSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

function formSubmitPayload(email, password, search = "") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  const nextEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextPassword = String(formData.get("password") ?? "").trim();
  const nextParam = new URLSearchParams(search).get("next");
  return buildLoginPasswordPayload({
    email: nextEmail,
    password: nextPassword,
    next: nextParam,
  });
}

test("LoginForm submit without ?next omits next so JSON is not INVALID_INPUT", () => {
  const payload = formSubmitPayload(" user@sooqna.demo ", "User@123", "");
  const json = JSON.stringify(payload);
  const parsedJson = JSON.parse(json);

  assert.deepEqual(Object.keys(parsedJson).sort(), ["email", "password"]);
  assert.equal(parsedJson.email, "user@sooqna.demo");
  assert.equal(parsedJson.password, "User@123");
  assert.equal("next" in parsedJson, false);
  assert.equal(json.includes('"next"'), false);

  assert.equal(legacyNextSchema.safeParse(parsedJson).success, true);
  assert.equal(apiLoginSchema.safeParse(parsedJson).success, true);

  const brokenBody = JSON.parse(
    JSON.stringify({
      email: parsedJson.email,
      password: parsedJson.password,
      next: new URLSearchParams("").get("next"),
    }),
  );
  assert.equal(brokenBody.next, null);
  assert.equal(legacyNextSchema.safeParse(brokenBody).success, false);
  assert.equal(apiLoginSchema.safeParse(brokenBody).success, true);
});

test("LoginForm submit with ?next=/admin includes next string", () => {
  const payload = formSubmitPayload(
    "admin@sooqna.demo",
    "Admin@123",
    "?next=/admin",
  );
  assert.equal(payload.next, "/admin");
  assert.equal(apiLoginSchema.safeParse(payload).success, true);
});

test("password case is preserved (not lowercased)", () => {
  const ok = formSubmitPayload("qa@example.com", "Abc123");
  const wrongCase = formSubmitPayload("qa@example.com", "abc123");
  assert.equal(ok.password, "Abc123");
  assert.equal(wrongCase.password, "abc123");
  assert.notEqual(ok.password, wrongCase.password);
});

test("invalid email is still sent as normalized string for client validation to catch", () => {
  const payload = formSubmitPayload("not-an-email", "User@123");
  assert.equal(payload.email, "not-an-email");
  assert.equal(apiLoginSchema.safeParse(payload).success, false);
});
