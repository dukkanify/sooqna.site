/** Public seller profile / listings page. */
export function getSellerHref(sellerId: string): string {
  return `/sellers/${encodeURIComponent(sellerId)}`;
}
