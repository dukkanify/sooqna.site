import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/services/auth/session-cookie";
import {
  ensureDemoAccounts,
  findUserByEmail,
  toUserProfile,
  getRedirectAfterAuth,
  restoreUserWithPasswordProof,
  saveUser,
} from "@/services/auth/user-store";
import { verifyPassword } from "@/services/auth/password.service";
import { readAccountProofCookie } from "@/services/auth/account-vault";
import { trackAuthEvent } from "@/services/analytics/auth-events";
import {
  INVALID_CREDENTIALS_MESSAGE,
  PASSWORD_NOT_SET_MESSAGE,
  ACCOUNT_UNVERIFIED_MESSAGE,
  ACCOUNT_SUSPENDED_MESSAGE,
  AUTH_STORE_UNAVAILABLE_MESSAGE,
} from "@/services/auth/auth-messages";
import { sendRegistrationVerifyOtp } from "@/services/auth/auth-handlers";
import { AuthStoreError } from "@/services/auth/user-persistence";
import { findAuthUserInMirrorByEmail } from "@/services/auth/auth-user-mirror";
import { maskEmail } from "@/shared/utils/mask-email";
import { getSafeNextPath, optionalRedirectPathSchema } from "@/shared/utils/safe-next";
import type { StoredUser } from "@/types/domain/user";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: optionalRedirectPathSchema,
  accountProof: z.string().min(20).optional(),
  fullName: z.string().min(1).optional(),
  accountType: z.enum(["buyer", "seller", "business", "individual", "company"]).optional(),
});

function passwordMatches(storedHash: string, password: string): boolean {
  try {
    return verifyPassword(password, storedHash);
  } catch {
    return false;
  }
}

async function reconcileFromMirrorIfNeeded(
  stored: StoredUser,
  password: string,
): Promise<StoredUser | null> {
  if (stored.passwordHash && passwordMatches(stored.passwordHash, password)) {
    return stored;
  }
  const mirrored = await findAuthUserInMirrorByEmail(stored.email);
  if (
    !mirrored?.passwordHash ||
    mirrored.passwordHash === stored.passwordHash ||
    !passwordMatches(mirrored.passwordHash, password)
  ) {
    return null;
  }
  const healed: StoredUser = {
    ...stored,
    passwordHash: mirrored.passwordHash,
    passwordUpdatedAt: mirrored.passwordUpdatedAt ?? new Date().toISOString(),
    sessionVersion: mirrored.sessionVersion ?? stored.sessionVersion,
  };
  try {
    return await saveUser(healed);
  } catch (error) {
    console.error("[Sooqna Auth] login mirror reconcile failed", error);
    return healed;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password.trim();

    // Keep demo operator accounts (admin@sooqna.demo, …) usable after DB resets.
    if (email.endsWith("@sooqna.demo") || email.endsWith("@uaesales.demo")) {
      try {
        await ensureDemoAccounts();
      } catch {
        // Fall through — login still attempts against whatever is stored.
      }
    }

    let stored = await findUserByEmail(email);
    if (!stored) {
      try {
        const cookieProof = await readAccountProofCookie(email);
        const passwordHash = parsed.data.accountProof ?? cookieProof?.passwordHash;
        if (passwordHash) {
          stored = await restoreUserWithPasswordProof({
            email,
            password,
            passwordHash,
            fullName: parsed.data.fullName ?? cookieProof?.fullName,
            accountType: parsed.data.accountType ?? cookieProof?.accountType,
          });
        }
      } catch {
        // Fall through to invalid-credentials if restore fails.
      }
    }

    if (stored && !stored.passwordHash) {
      return NextResponse.json(
        {
          error: "PASSWORD_NOT_SET",
          message: PASSWORD_NOT_SET_MESSAGE,
        },
        { status: 403 },
      );
    }

    if (stored?.passwordHash) {
      const reconciled = await reconcileFromMirrorIfNeeded(stored, password);
      if (reconciled) stored = reconciled;
    }

    if (stored?.passwordHash && passwordMatches(stored.passwordHash, password)) {
      if (stored.accountStatus === "suspended") {
        return NextResponse.json(
          { error: "ACCOUNT_SUSPENDED", message: ACCOUNT_SUSPENDED_MESSAGE },
          { status: 403 },
        );
      }
      if (stored.accountStatus === "pending" && !stored.emailVerifiedAt) {
        // First-time registration only: send a fresh REGISTER OTP so the
        // verify-email screen never waits on a code that was never delivered.
        let emailDelivered = false;
        try {
          const sent = await sendRegistrationVerifyOtp({
            email,
            fullName: stored.fullName,
            userId: stored.id,
            accountType: stored.accountType,
            // Password-gated login: always issue a fresh code so the verify
            // screen is not waiting on a never-delivered earlier OTP.
            skipCooldown: true,
          });
          emailDelivered = sent.delivered;
        } catch (error) {
          console.error(
            "[Sooqna Auth] login REGISTER OTP send failed",
            error,
          );
        }
        const params = new URLSearchParams({
          email,
          purpose: "REGISTER",
          masked: maskEmail(email),
        });
        if (!emailDelivered) {
          params.set("emailDelivered", "0");
        }
        return NextResponse.json(
          {
            error: "ACCOUNT_UNVERIFIED",
            message: ACCOUNT_UNVERIFIED_MESSAGE,
            redirectTo: `/verify-email?${params.toString()}`,
            emailDelivered,
          },
          { status: 403 },
        );
      }
      if (stored.accountStatus === "pending") {
        const user = toUserProfile(stored);
        await setSessionCookie(user);
        trackAuthEvent("login_verified");
        return NextResponse.json({
          ok: true,
          user,
          redirectTo: "/register/pending",
        });
      }
      const user = toUserProfile(stored);
      await setSessionCookie(user);
      trackAuthEvent("login_verified");
      const redirectTo = getSafeNextPath(
        parsed.data.next,
        getRedirectAfterAuth(user, parsed.data.next),
      );
      return NextResponse.json({
        ok: true,
        user,
        redirectTo,
      });
    }

    return NextResponse.json(
      { error: "INVALID_CREDENTIALS", message: INVALID_CREDENTIALS_MESSAGE },
      { status: 401 },
    );
  } catch (error) {
    if (error instanceof AuthStoreError) {
      return NextResponse.json(
        { error: "LOGIN_FAILED", message: AUTH_STORE_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "LOGIN_FAILED", message: "تعذر تسجيل الدخول حاليًا. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
