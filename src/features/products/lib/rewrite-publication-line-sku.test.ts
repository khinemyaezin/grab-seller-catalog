import { describe, expect, it } from "vitest";
import { rewritePublicationLineSku } from "./rewrite-publication-line-sku";

describe("rewritePublicationLineSku", () => {
  it("rewrites matching skus and leaves other lines alone", () => {
    expect(
      rewritePublicationLineSku(
        [
          { sku: "SKU-1", salesChannelId: "web-1" },
          { sku: "SKU-2", salesChannelId: "mkt-1" },
        ],
        "SKU-1",
        "SKU-RENAMED",
      ),
    ).toEqual([
      { sku: "SKU-RENAMED", salesChannelId: "web-1" },
      { sku: "SKU-2", salesChannelId: "mkt-1" },
    ]);
  });

  it("returns the original lines when the sku did not change", () => {
    const lines = [{ sku: "SKU-1", salesChannelId: "web-1" }];
    expect(rewritePublicationLineSku(lines, "SKU-1", "SKU-1")).toBe(lines);
  });
});
