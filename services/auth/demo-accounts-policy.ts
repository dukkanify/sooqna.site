/**
 * Demo operator accounts (@sooqna.demo) are for local/dev only.
 * On Vercel production/preview they must never seed into Neon or login.
 */

export function isDemoAccountEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@sooqna.demo") ||
    normalized.endsWith("@uaesales.demo")
  );
}

/** True when demo account seeding / login is explicitly allowed. */
export function isDemoAccountsAllowed(): boolean {
  if (process.env.ALLOW_DEMO_ACCOUNTS === "true") return true;
  if (process.env.ALLOW_DEMO_ACCOUNTS === "false") return false;
  // Vercel preview/production share Neon — keep demo off unless forced.
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    return false;
  }
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

export function shouldSeedDemoAccounts(): boolean {
  return isDemoAccountsAllowed();
}
