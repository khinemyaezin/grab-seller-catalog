export const CREATE_SELLABLE_PRODUCT_WORKFLOW = "create-sellable-product";
export const UPDATE_SELLABLE_PRODUCT_WORKFLOW = "update-sellable-product";
export const UPDATE_PRODUCT_VARIANT_WORKFLOW = "update-product-variant";

export const DEFAULT_WORKFLOW_TIMEOUT_MS = 120_000;

export const TERMINAL_WORKFLOW_STATUSES = new Set(["COMPLETED", "FAILED", "COMPENSATED"]);
