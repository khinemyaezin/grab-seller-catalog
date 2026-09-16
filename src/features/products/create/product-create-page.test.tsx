import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import NewProductPage from "./product-create-page";

const mockUseRoot = vi.fn();

vi.mock("@/features/products/api/use-root", () => ({
  useRoot: () => mockUseRoot(),
}));

vi.mock("./use-product-create-events", () => ({
  useProductCreateEvents: () => ({ handleEvent: vi.fn() }),
}));

vi.mock("./product-new-form", () => ({
  default: () => <div>product-form</div>,
}));

vi.mock("@khinemyaezin/seller-ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@khinemyaezin/seller-ui")>();
  return {
    ...actual,
    SlotProvider: ({ children }: { children: React.ReactNode }) => children,
    usePlatform: () => ({ events: { subscribe: () => () => undefined } }),
  };
});

describe("NewProductPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render an actionable form when the create link is missing", () => {
    mockUseRoot.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <NewProductPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Product creation is not available.")).toBeTruthy();
    expect(screen.queryByText("product-form")).toBeNull();
  });

  it("renders the form when the create link exists", () => {
    mockUseRoot.mockReturnValue({
      data: { createSellableProduct: { href: "/workflows/create-sellable-product" } },
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <NewProductPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("product-form")).toBeTruthy();
    expect(screen.queryByText("Product creation is not available.")).toBeNull();
  });
});
