"use client";

import { useSyncExternalStore } from "react";
import type { Listing } from "@/types";
import {
  ListingPrimaryAction,
  SellerContactActions,
} from "@/features/listings/components/ListingPrimaryAction";
import {
  getListingActionConfig,
} from "@/shared/constants/listingActionConfig";
import { isOwnListing } from "@/shared/listings/listing-ownership";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { getSessionSnapshot, subscribeSession } from "@/services/storage/external-store";

type MobileListingPrimaryCtasProps = {
  listing: Listing;
};

/**
 * In-flow mobile CTAs (Buy / Contact / category action) so users see the
 * correct intent under the title — not Favorite / Share / Print.
 */
export function MobileListingPrimaryCtas({ listing }: MobileListingPrimaryCtasProps) {
  const config = getListingActionConfig(listing);
  const user = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const isOwn = user ? isOwnListing(listing, user) : false;

  if (isOwn) return null;

  return (
    <LocalizedTree>
      <div className="mt-4 grid gap-2 lg:hidden">
        <ListingPrimaryAction
          action={config.primaryAction}
          listing={listing}
          size="md"
        />
        <SellerContactActions
          hideChat={
            config.primaryAction === "CONTACT_SELLER" ||
            config.primaryAction === "SEND_MESSAGE"
          }
          listing={listing}
          stacked={false}
        />
      </div>
    </LocalizedTree>
  );
}
