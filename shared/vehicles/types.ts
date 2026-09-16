export type VehicleMakeStatus = "active" | "disabled";

export type VehicleMake = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  status: VehicleMakeStatus;
  sortOrder: number;
  countryCode?: string;
  countryNameEn?: string;
  countryNameAr?: string;
};

export type VehicleModel = {
  id: string;
  makeId: string;
  makeSlug: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  active: boolean;
  sortOrder: number;
  yearFrom?: number;
  yearTo?: number;
  bodyType?: string;
};

export type VehicleCatalog = {
  version: number;
  generatedAt: string;
  source: string;
  makes: VehicleMake[];
  models: VehicleModel[];
};
