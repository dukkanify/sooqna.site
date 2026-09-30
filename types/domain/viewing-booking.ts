export type ViewingBookingStatus =
  | "pending"
  | "confirmed"
  | "modification_proposed"
  | "cancelled"
  | "completed";

export type ViewingBooking = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  phone: string;
  date: string;
  time: string;
  visitors: number;
  notes?: string;
  sellerId: string;
  sellerName: string;
  status: ViewingBookingStatus;
  /** Seller-proposed alternative slot (when status is modification_proposed). */
  proposedDate?: string;
  proposedTime?: string;
  proposedNote?: string;
  proposedBy?: "seller" | "buyer" | "admin";
  createdAt: string;
  updatedAt?: string;
};

/** Per-seller weekly availability for property viewings. */
export type SellerViewingAvailability = {
  /** Same as sellerId — required by durable collection store. */
  id: string;
  sellerId: string;
  /** ISO weekdays 0=Sun … 6=Sat that accept bookings. Empty = all days. */
  weekdays: number[];
  /** Allowed time slots (HH:mm). Empty = platform default slots. */
  timeSlots: string[];
  updatedAt: string;
};
