"use client";

import { useState } from "react";
import type { UserProfile } from "@/types";
import { OtpVerification } from "@/features/auth/components/OtpVerification";
import { saveOtpFallback } from "@/features/auth/lib/otp-fallback";
import { setSessionUser } from "@/services/storage";
import { isDemoOtpClientEnabled } from "@/shared/constants/feature-flags";
import { Button } from "@/shared/ui/Button";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { maskEmail } from "@/shared/utils/mask-email";
import { useToast } from "@/shared/components/ToastProvider";

type ChangeEmailSectionProps = {
  user: UserProfile;
  onUserUpdated: (user: UserProfile) => void;
};

type Step = "idle" | "form" | "confirm_otp";

export function ChangeEmailSection({
  user,
  onUserUpdated,
}: ChangeEmailSectionProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(
    user.pendingEmail ? "confirm_otp" : "idle",
  );
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [pendingEmail, setPendingEmailState] = useState(
    user.pendingEmail ?? "",
  );
  const [initialOtp, setInitialOtp] = useState<string | null>(null);
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reauthSent, setReauthSent] = useState(false);

  const hasPassword = Boolean(user.hasPassword);

  async function cancelPending() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/email/cancel", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        user?: UserProfile;
      };
      if (response.ok && data.user) {
        setSessionUser(data.user);
        onUserUpdated(data.user);
      }
    } finally {
      setPendingEmailState("");
      setNewEmail("");
      setPassword("");
      setReauthCode("");
      setInitialOtp(null);
      setReauthSent(false);
      setStep("idle");
      setBusy(false);
      setMessage("تم إلغاء طلب تغيير البريد.");
      setError(false);
    }
  }

  async function sendReauthOtp() {
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/profile/email/reauth", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        otp?: string;
        emailDelivered?: boolean;
      };
      if (!response.ok) {
        setError(true);
        setMessage(data.message ?? "تعذر إرسال رمز التحقق.");
        return;
      }
      setReauthSent(true);
      if (
        isDemoOtpClientEnabled() &&
        typeof data.otp === "string" &&
        /^\d{6}$/.test(data.otp)
      ) {
        saveOtpFallback(user.email, data.otp);
        setReauthCode(data.otp);
        showToast(`رمز التحقق: ${data.otp}`);
      }
      setMessage(
        data.emailDelivered === false
          ? "تعذر إرسال البريد — استخدم الرمز الظاهر إن وُجد، أو حاول مجدداً."
          : `أرسلنا رمزاً إلى ${maskEmail(user.email)}. أدخله ثم تابع.`,
      );
      setError(data.emailDelivered === false);
    } catch {
      setError(true);
      setMessage("تعذر إرسال رمز التحقق.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRequest() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError(true);
      setMessage("أدخل بريداً إلكترونياً صالحاً.");
      return;
    }
    if (hasPassword && !password.trim()) {
      setError(true);
      setMessage("أدخل كلمة المرور لتأكيد تغيير البريد.");
      return;
    }
    if (!hasPassword && reauthCode.trim().length !== 6) {
      setError(true);
      setMessage("أدخل رمز التحقق من بريدك الحالي (6 أرقام).");
      return;
    }

    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/profile/email/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: email,
          ...(hasPassword
            ? { password: password.trim() }
            : { reauthCode: reauthCode.trim() }),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        pendingEmail?: string;
        otp?: string;
        emailDelivered?: boolean;
        user?: UserProfile;
      };

      if (!response.ok) {
        setError(true);
        setMessage(data.message ?? "تعذر بدء تغيير البريد.");
        return;
      }

      if (data.user) {
        setSessionUser(data.user);
        onUserUpdated(data.user);
      }
      const pending = data.pendingEmail ?? email;
      setPendingEmailState(pending);
      const revealedOtp =
        isDemoOtpClientEnabled() &&
        typeof data.otp === "string" &&
        /^\d{6}$/.test(data.otp)
          ? data.otp
          : null;
      // When demo OTP is already on-screen, skip delivery-failed auto-resend noise.
      setEmailDeliveryFailed(data.emailDelivered === false && !revealedOtp);
      if (revealedOtp) {
        saveOtpFallback(pending, revealedOtp);
        setInitialOtp(revealedOtp);
      } else {
        setInitialOtp(null);
      }
      setPassword("");
      setReauthCode("");
      setStep("confirm_otp");
      setMessage(
        data.message ??
          "أرسلنا رمز تحقق إلى البريد الجديد. لن يُعتمد التغيير قبل التأكيد.",
      );
      setError(false);
    } catch {
      setError(true);
      setMessage("تعذر بدء تغيير البريد.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "confirm_otp" && pendingEmail) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-border/70 bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-muted">
          بريدك الحالي يبقى{" "}
          <span className="font-bold text-ink">{user.email}</span> حتى تؤكد
          البريد الجديد{" "}
          <span className="font-bold text-ink">{maskEmail(pendingEmail)}</span>.
        </p>
        <div className="mt-4">
          <OtpVerification
            email={pendingEmail}
            emailDeliveryFailed={emailDeliveryFailed}
            fullName={user.fullName}
            initialOtp={initialOtp}
            maskedEmail={maskEmail(pendingEmail)}
            onBack={() => void cancelPending()}
            onVerified={(data) => {
              if (data?.user) {
                setSessionUser(data.user);
                onUserUpdated(data.user);
              }
              setPendingEmailState("");
              setNewEmail("");
              setInitialOtp(null);
              setStep("idle");
              setMessage("تم تحديث بريدك الإلكتروني بنجاح.");
              setError(false);
            }}
            purpose="EMAIL_CHANGE"
            resendEndpoint="/api/profile/email/resend"
            verifyEndpoint="/api/profile/email/confirm"
          />
        </div>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-border/70 bg-surface-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">تغيير البريد الإلكتروني</p>
            <p className="mt-1 text-sm text-muted">
              يتطلب تأكيد كلمة المرور أو رمز تحقق، ثم تأكيد البريد الجديد قبل
              الاعتماد.
            </p>
          </div>
          <Button
            onClick={() => {
              setStep("form");
              setMessage("");
              setError(false);
              setReauthSent(false);
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            تغيير البريد
          </Button>
        </div>
        {message ? (
          <div className="mt-3">
            <FormMessage variant={error ? "error" : "success"}>
              {message}
            </FormMessage>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/70 bg-surface-muted/40 p-4">
      <p className="text-sm font-bold text-ink">تغيير البريد الإلكتروني</p>
      <p className="mt-1 text-sm text-muted">
        لن يُستبدل بريدك الحالي إلا بعد إدخال رمز التحقق المرسل إلى العنوان
        الجديد.
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          autoComplete="email"
          label="البريد الجديد"
          onChange={(event) => setNewEmail(event.target.value)}
          type="email"
          value={newEmail}
        />
        {hasPassword ? (
          <Input
            autoComplete="current-password"
            hint="للتأكيد أنك صاحب الحساب"
            label="كلمة المرور الحالية"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted">
                لا توجد كلمة مرور — أكّد هويتك برمز على بريدك الحالي.
              </p>
              <Button
                disabled={busy}
                onClick={() => void sendReauthOtp()}
                size="sm"
                type="button"
                variant="secondary"
              >
                {reauthSent ? "إعادة إرسال الرمز" : "إرسال رمز لبريدي الحالي"}
              </Button>
            </div>
            {reauthSent ? (
              <Input
                label="رمز التحقق من بريدك الحالي"
                maxLength={6}
                onChange={(event) =>
                  setReauthCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                value={reauthCode}
              />
            ) : null}
          </>
        )}
      </div>

      {message ? (
        <div className="mt-3">
          <FormMessage variant={error ? "error" : "success"}>
            {message}
          </FormMessage>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() => void submitRequest()}
          type="button"
        >
          {busy ? "جاري الإرسال..." : "إرسال رمز للبريد الجديد"}
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setStep("idle");
            setPassword("");
            setReauthCode("");
            setReauthSent(false);
            setMessage("");
          }}
          type="button"
          variant="ghost"
        >
          إلغاء
        </Button>
      </div>
    </div>
  );
}
