import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachProductDescriptions,
  isDescriptionsDirty,
  overviewDescription,
  toProductDescriptionFormItems,
  toReplaceDescriptionsPayload,
  withOverviewDescription,
} from "./product-descriptions";
import type { ProductDescription } from "@/features/products/types";

const mockReplaceProductDescriptions = vi.fn();

vi.mock("./catalog", () => ({
  catalogService: {
    replaceProductDescriptions: (...args: unknown[]) => mockReplaceProductDescriptions(...args),
  },
}));

const replaceLink = {
  href: "/catalog/products/{productId}/descriptions",
  templated: true,
};

function overview(overrides: Partial<ProductDescription> = {}): ProductDescription {
  return {
    id: "desc-1",
    name: "overview",
    title: "Overview",
    description: "Soft cotton shirt",
    ...overrides,
  };
}

describe("overview description helpers", () => {
  it("maps GET descriptions onto form items", () => {
    expect(toProductDescriptionFormItems(null)).toEqual([]);
    expect(toProductDescriptionFormItems([overview()])).toEqual([overview()]);
  });

  it("reads the overview body and preserves id when editing", () => {
    const items = [overview()];
    expect(overviewDescription(items)).toBe("Soft cotton shirt");
    expect(withOverviewDescription(items, "Updated copy")).toEqual([
      overview({ description: "Updated copy" }),
    ]);
  });

  it("creates an overview section when the form starts empty", () => {
    expect(withOverviewDescription([], "New copy")).toEqual([
      { name: "overview", title: "Overview", description: "New copy" },
    ]);
  });

  it("drops the editable section when the textarea is cleared", () => {
    expect(withOverviewDescription([overview(), {
      id: "desc-2",
      name: "specifications",
      title: "Specifications",
      description: "Cotton",
    }], "   ")).toEqual([
      {
        id: "desc-2",
        name: "specifications",
        title: "Specifications",
        description: "Cotton",
      },
    ]);
  });

  it("uses the first section when overview is missing", () => {
    const summary = {
      id: "desc-1",
      name: "summary",
      title: "Summary",
      description: "Original",
    };
    expect(overviewDescription([summary])).toBe("Original");
    expect(withOverviewDescription([summary], "Edited")).toEqual([
      { ...summary, description: "Edited" },
    ]);
  });
});

describe("toReplaceDescriptionsPayload", () => {
  it("omits blank rows and ids that are not yet assigned", () => {
    expect(toReplaceDescriptionsPayload([
      { name: "overview", title: "Overview", description: "  " },
      { name: "overview", description: "Body" },
    ])).toEqual([
      { name: "overview", description: "Body" },
    ]);
  });
});

describe("isDescriptionsDirty", () => {
  it("is false when payloads match", () => {
    const items = [overview()];
    expect(isDescriptionsDirty(items, items)).toBe(false);
    expect(isDescriptionsDirty([], [])).toBe(false);
  });

  it("is true when copy changes or is cleared", () => {
    expect(isDescriptionsDirty([overview({ description: "New" })], [overview()])).toBe(true);
    expect(isDescriptionsDirty([], [overview()])).toBe(true);
  });
});

describe("attachProductDescriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when descriptions are unchanged", async () => {
    const items = [overview()];
    await attachProductDescriptions({
      productId: "prod-1",
      items,
      seed: items,
      replaceDescriptionsLink: replaceLink,
    });

    expect(mockReplaceProductDescriptions).not.toHaveBeenCalled();
  });

  it("replaces with overview payload and empty list when cleared", async () => {
    mockReplaceProductDescriptions.mockResolvedValue({ productId: "prod-1", descriptions: [] });

    await attachProductDescriptions({
      productId: "prod-1",
      items: [overview({ description: "Updated" })],
      seed: [overview()],
      replaceDescriptionsLink: replaceLink,
    });

    expect(mockReplaceProductDescriptions.mock.calls[0][0].href).toBe(
      "/catalog/products/prod-1/descriptions",
    );
    expect(mockReplaceProductDescriptions.mock.calls[0][1]).toEqual({
      descriptions: [
        {
          id: "desc-1",
          name: "overview",
          title: "Overview",
          description: "Updated",
        },
      ],
    });

    await attachProductDescriptions({
      productId: "prod-1",
      items: [],
      seed: [overview()],
      replaceDescriptionsLink: replaceLink,
    });

    expect(mockReplaceProductDescriptions.mock.calls[1][1]).toEqual({ descriptions: [] });
  });
});
