/**
 * Marketplace listing seeds are local-dev only.
 * Vercel Preview/Production and NODE_ENV=production never auto-inject fake listings.
 */
export function allowMockCatalogSeed(): boolean {
  if (process.env.ALLOW_MOCK_CATALOG === "true") return true;
  if (process.env.ALLOW_MOCK_CATALOG === "false") return false;
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

/** Confirmed mock/seed listing ids from mock/*.mock.ts — never matches local-/admin-/e2e- user records. */
export function isMockSeedListingId(id: string): boolean {
  return (
    /^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-\d{3}$/.test(
      id,
    ) ||
    /^listing-extra-\d+$/.test(id) ||
    /^user-listing-\d{3}$/.test(id)
  );
}
