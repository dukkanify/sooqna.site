/** Pure helpers for real-estate license / regulator cross-checks. */

export type RealEstateLicenseContext = {
  advertiserType?: string;
  regulatoryAuthority?: string;
  emirate?: string;
  licenseNumber?: string;
  brn?: string;
  bln?: string;
};

export const RE_LICENSE_PATTERNS = {
  licenseNumber: /^[A-Za-z0-9\/\-]{3,30}$/,
  brn: /^\d{5,8}$/,
  bln: /^[A-Za-z0-9\-]{4,20}$/,
} as const;

export function isBrokerAdvertiser(advertiserType: string | undefined): boolean {
  return advertiserType === "broker";
}

export function regulatorEmirateError(
  advertiserType: string | undefined,
  authority: string | undefined,
  emirate: string | undefined,
): string | undefined {
  if (!isBrokerAdvertiser(advertiserType) || !authority || !emirate) {
    return undefined;
  }
  if (authority === "DLD" && emirate !== "دبي") {
    return "DLD مخصص لإمارة دبي.";
  }
  if (authority === "ADREC" && emirate !== "أبوظبي") {
    return "ADREC مخصص لإمارة أبوظبي.";
  }
  return undefined;
}

export function expectsBrn(ctx: RealEstateLicenseContext): boolean {
  return (
    isBrokerAdvertiser(ctx.advertiserType) && ctx.regulatoryAuthority === "DLD"
  );
}

export function expectsBln(ctx: RealEstateLicenseContext): boolean {
  return (
    isBrokerAdvertiser(ctx.advertiserType) && ctx.regulatoryAuthority === "ADREC"
  );
}
