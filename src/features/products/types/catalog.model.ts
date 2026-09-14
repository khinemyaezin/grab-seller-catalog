import type { SlotValidationErrors } from "@khinemyaezin/seller-contracts";

export type Product = {
  name: string;
  category: Category | null;
  variants: Variant[];
  standaloneVariant: Partial<Variant>;
};

export type Category = {
  id: string;
  name: string;
};

export type Variant = {
  name: string;
  matrixKey: string;
  sku: string;
  id?: string;
  variations: Variation[];
  manageInventory?: boolean;
};

export type Variation = {
  typeId: string;
  optionId: string;
};

export type VariationMatrix = {
  types: VariationType[];
  variants: Variant[];
};

export type VariationOption = {
  uuid: string;
  name: string;
};

export type VariationType = {
  uuid: string;
  name: string;
  options: VariationOption[];
};

export type MatrixVariantVariation = {
  optionId: string;
  typeId: string;
};

export type CategoryLeaf = {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  listingAllowed: boolean;
  reviewRequired: boolean;
  c2cAllowed: boolean;
};

export type ProductLifecycleEvent =
  | { type: "titleResolved"; title: string }
  | { type: "created" }
  | { type: "createFailed" }
  | { type: "createTimedOut" }
  | { type: "validationFailed"; name?: string; errors?: SlotValidationErrors }
  | { type: "updated" }
  | { type: "updateFailed" }
  | { type: "updateTimedOut" }
  | { type: "archived"; name?: string }
  | { type: "archiveFailed"; name?: string }
  | { type: "restored" }
  | { type: "restoreFailed" }
  | { type: "published"; name?: string }
  | { type: "publishFailed"; name?: string }
  | { type: "deleted"; name?: string }
  | { type: "deleteFailed"; name?: string }

export type ProductStatus = | "DRAFT" | "ACTIVE" | "ARCHIVED" | "SUSPENDED";
