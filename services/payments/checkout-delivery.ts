export type DeliveryAddressSnapshot = {
  label?: string;
  fullName: string;
  phone: string;
  emirate: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  unit?: string;
  landmark?: string;
  notes?: string;
  companyName?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
};

export type CheckoutDeliveryAddressInput = {
  label?: string;
  fullName?: string;
  phone?: string;
  emirate: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  unit?: string;
  landmark?: string;
  notes?: string;
  companyName?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
};

export function snapshotDeliveryAddress(input: {
  buyerName: string;
  buyerPhone: string;
  deliveryAddress?: CheckoutDeliveryAddressInput;
  savedAddress?: {
    label?: string;
    fullName: string;
    phone: string;
    emirate: string;
    city: string;
    area: string;
    street: string;
    building?: string;
    unit?: string;
    landmark?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };
}): DeliveryAddressSnapshot | undefined {
  const source = input.deliveryAddress ?? input.savedAddress;
  if (!source) return undefined;

  const phone = (
    input.deliveryAddress?.phone ||
    input.buyerPhone ||
    input.savedAddress?.phone ||
    ""
  ).trim();
  const fullName =
    input.deliveryAddress?.fullName?.trim() ||
    input.savedAddress?.fullName ||
    input.buyerName;

  return {
    label: input.deliveryAddress?.label ?? input.savedAddress?.label,
    fullName,
    phone,
    emirate: source.emirate,
    city: source.city,
    area: source.area,
    street: source.street,
    building: source.building,
    unit: source.unit,
    landmark: source.landmark,
    notes: source.notes,
    companyName: input.deliveryAddress?.companyName,
    latitude: source.latitude,
    longitude: source.longitude,
    formattedAddress: source.formattedAddress,
  };
}

export function checkoutDeliveryFingerprint(input: {
  feesTotal: number;
  shippingMethod?: string;
  addressId?: string;
  snapshot?: DeliveryAddressSnapshot;
}): string {
  return JSON.stringify({
    feesTotal: input.feesTotal,
    shippingMethod: input.shippingMethod ?? "",
    addressId: input.addressId ?? "",
    phone: input.snapshot?.phone ?? "",
    fullName: input.snapshot?.fullName ?? "",
    emirate: input.snapshot?.emirate ?? "",
    city: input.snapshot?.city ?? "",
    area: input.snapshot?.area ?? "",
    street: input.snapshot?.street ?? "",
    lat: input.snapshot?.latitude ?? null,
    lng: input.snapshot?.longitude ?? null,
  });
}
