import { describe, expect, it } from "vitest";
import { isSellerFacingChannel, salesChannelLabel } from "./sales-channel-label";

describe("salesChannelLabel", () => {
  it("maps known channel types", () => {
    expect(salesChannelLabel("WEBSITE")).toBe("Website");
    expect(salesChannelLabel("MARKETPLACE")).toBe("Marketplace");
  });
});

describe("isSellerFacingChannel", () => {
  it("includes website and marketplace only", () => {
    expect(isSellerFacingChannel("WEBSITE")).toBe(true);
    expect(isSellerFacingChannel("MARKETPLACE")).toBe(true);
    expect(isSellerFacingChannel("POS")).toBe(false);
  });
});
