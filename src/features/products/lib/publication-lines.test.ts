import { describe, expect, it } from "vitest";
import {
  channelPublishedOnAllSkus,
  collapsePublicationLinesToStandalone,
  matrixPublicationSkus,
  publicationTargetSkus,
  syncPublicationLinesForMatrixVariants,
  togglePublicationChannelForSkus,
  unionChannelIds,
} from "./publication-lines";
import type { Variant } from "@/features/products/types";

const red: Variant = {
  name: "Red",
  matrixKey: "red",
  sku: "SKU-RED",
  variations: [{ typeId: "t1", optionId: "o1" }],
};

describe("publicationTargetSkus", () => {
  it("returns the standalone sku when there are no option types", () => {
    expect(
      publicationTargetSkus({
        variationTypes: [],
        product: { standaloneVariant: { sku: " MUG-1 " }, variants: [red] },
      }),
    ).toEqual(["MUG-1"]);
  });

  it("returns an empty list when the standalone sku is blank", () => {
    expect(
      publicationTargetSkus({
        variationTypes: [],
        product: { standaloneVariant: { sku: "" }, variants: [] },
      }),
    ).toEqual([]);
  });

  it("returns matrix skus when option types exist", () => {
    expect(
      publicationTargetSkus({
        variationTypes: [{ uuid: "t1", name: "Color", options: [] }],
        product: {
          standaloneVariant: { sku: "MUG-1" },
          variants: [red, { ...red, sku: "", matrixKey: "empty", variations: [] }],
        },
      }),
    ).toEqual(["SKU-RED"]);
  });
});

describe("unionChannelIds", () => {
  it("returns unique channels for the given skus", () => {
    expect(
      unionChannelIds(
        [
          { sku: "MUG-1", salesChannelId: "web-1" },
          { sku: "SKU-RED", salesChannelId: "web-1" },
          { sku: "SKU-RED", salesChannelId: "mkt-1" },
        ],
        ["SKU-RED"],
      ),
    ).toEqual(["web-1", "mkt-1"]);
  });
});

describe("togglePublicationChannelForSkus", () => {
  it("adds a channel to every sku", () => {
    expect(
      togglePublicationChannelForSkus(
        [{ sku: "SKU-RED", salesChannelId: "web-1" }],
        ["SKU-RED", "SKU-BLUE"],
        "web-1",
        false,
      ),
    ).toEqual([
      { sku: "SKU-RED", salesChannelId: "web-1" },
      { sku: "SKU-BLUE", salesChannelId: "web-1" },
    ]);
  });

  it("removes a channel from every sku", () => {
    expect(
      togglePublicationChannelForSkus(
        [
          { sku: "SKU-RED", salesChannelId: "web-1" },
          { sku: "SKU-BLUE", salesChannelId: "web-1" },
          { sku: "SKU-RED", salesChannelId: "mkt-1" },
        ],
        ["SKU-RED", "SKU-BLUE"],
        "web-1",
        true,
      ),
    ).toEqual([{ sku: "SKU-RED", salesChannelId: "mkt-1" }]);
  });
});

describe("channelPublishedOnAllSkus", () => {
  it("is true only when every sku has the channel", () => {
    const lines = [
      { sku: "SKU-RED", salesChannelId: "web-1" },
      { sku: "SKU-BLUE", salesChannelId: "mkt-1" },
    ];
    expect(channelPublishedOnAllSkus(lines, ["SKU-RED", "SKU-BLUE"], "web-1")).toBe(false);
    expect(channelPublishedOnAllSkus(
      [...lines, { sku: "SKU-BLUE", salesChannelId: "web-1" }],
      ["SKU-RED", "SKU-BLUE"],
      "web-1",
    )).toBe(true);
  });
});

describe("syncPublicationLinesForMatrixVariants", () => {
  it("keeps standalone lines until a matrix sku exists", () => {
    const lines = [{ sku: "MUG-1", salesChannelId: "web-1" }];
    expect(syncPublicationLinesForMatrixVariants(lines, "MUG-1", [])).toEqual(lines);
  });

  it("copies standalone channels onto new matrix skus and drops the standalone sku", () => {
    expect(
      syncPublicationLinesForMatrixVariants(
        [{ sku: "MUG-1", salesChannelId: "web-1" }],
        "MUG-1",
        ["SKU-RED", "SKU-BLUE"],
      ),
    ).toEqual([
      { sku: "SKU-RED", salesChannelId: "web-1" },
      { sku: "SKU-BLUE", salesChannelId: "web-1" },
    ]);
  });

  it("copies sibling channels onto a new matrix sku without clobbering overrides", () => {
    expect(
      syncPublicationLinesForMatrixVariants(
        [
          { sku: "SKU-RED", salesChannelId: "web-1" },
          { sku: "SKU-RED", salesChannelId: "mkt-1" },
        ],
        "MUG-1",
        ["SKU-RED", "SKU-BLUE"],
      ),
    ).toEqual([
      { sku: "SKU-RED", salesChannelId: "web-1" },
      { sku: "SKU-RED", salesChannelId: "mkt-1" },
      { sku: "SKU-BLUE", salesChannelId: "web-1" },
      { sku: "SKU-BLUE", salesChannelId: "mkt-1" },
    ]);
  });
});

describe("collapsePublicationLinesToStandalone", () => {
  it("rewrites unique channels onto the standalone sku", () => {
    expect(
      collapsePublicationLinesToStandalone(
        [
          { sku: "SKU-RED", salesChannelId: "web-1" },
          { sku: "SKU-BLUE", salesChannelId: "web-1" },
          { sku: "SKU-BLUE", salesChannelId: "mkt-1" },
        ],
        "MUG-1",
      ),
    ).toEqual([
      { sku: "MUG-1", salesChannelId: "web-1" },
      { sku: "MUG-1", salesChannelId: "mkt-1" },
    ]);
  });
});

describe("matrixPublicationSkus", () => {
  it("ignores empty-variation and blank sku rows", () => {
    expect(
      matrixPublicationSkus([
        red,
        { ...red, sku: "  ", matrixKey: "blank" },
        { ...red, sku: "MUG-1", matrixKey: "stand", variations: [] },
      ]),
    ).toEqual(["SKU-RED"]);
  });
});
