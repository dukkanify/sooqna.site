"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/shared/ui/Input";
import {
  formatUaeMobilePretty,
  hasUsualUaeMobilePrefix,
  isValidUaeMobile,
  listingPrefillPhone,
  sanitizeUaePhoneInput,
  uaeMobileIssue,
  UAE_MOBILE_PREFIX_HINT,
} from "@/shared/utils/phone";

type UaePhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value" | "defaultValue"
> & {
  compact?: boolean;
  defaultValue?: string;
  error?: string;
  hint?: string;
  label?: string;
  name: string;
  onValueChange?: (value: string) => void;
  value?: string;
  /** Show “filled from profile” only when a valid UAE mobile was prefilled. */
  filledFromProfile?: boolean;
};

export function UaePhoneInput({
  compact,
  defaultValue = "",
  error,
  filledFromProfile = false,
  hint,
  label = "رقم التواصل",
  name,
  onValueChange,
  required,
  value: valueProp,
  ...props
}: UaePhoneInputProps) {
  const prefilled = listingPrefillPhone(defaultValue || valueProp || "");
  const [uncontrolled, setUncontrolled] = useState(prefilled);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolled;

  function setValue(next: string) {
    if (!isControlled) setUncontrolled(next);
    onValueChange?.(next);
  }
  const [touched, setTouched] = useState(false);
  const empty = value.trim().length === 0;
  const valid = isValidUaeMobile(value);
  const liveIssue =
    touched && !empty && !valid ? uaeMobileIssue(value) : null;
  const displayError = error ?? liveIssue ?? undefined;
  const showProfileHint =
    filledFromProfile &&
    Boolean(prefilled) &&
    listingPrefillPhone(value) === prefilled;
  const prefixHint =
    !displayError && valid && !hasUsualUaeMobilePrefix(value)
      ? UAE_MOBILE_PREFIX_HINT
      : undefined;
  const displayHint = displayError
    ? undefined
    : showProfileHint
      ? "تم تعبئة الرقم من ملفك الشخصي — يمكنك تعديله لهذا الإعلان."
      : prefixHint ?? hint;

  return (
    <div>
      <Input
        {...props}
        autoComplete="tel"
        compact={compact}
        dir="ltr"
        error={displayError}
        hint={displayHint}
        inputMode="tel"
        label={label}
        name={name}
        onBlur={() => {
          setTouched(true);
          if (isValidUaeMobile(value)) {
            setValue(formatUaeMobilePretty(value));
          }
        }}
        onChange={(event) => {
          setValue(sanitizeUaePhoneInput(event.target.value));
        }}
        placeholder="050 123 4567"
        required={required}
        type="tel"
        value={value}
      />
    </div>
  );
}
