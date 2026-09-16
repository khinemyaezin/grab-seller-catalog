import { resolveLink } from "@khinemyaezin/seller-api";
import { catalogService } from "./catalog";
import type { CreateSellableProductResponse } from "@/features/products/types";
import type { AwaitWorkflowResult } from "@/features/products/use-workflow-awaiter";

export async function resolveWorkflowProductId(
  result: AwaitWorkflowResult<CreateSellableProductResponse>,
): Promise<string> {
  if (result.response?.productId) {
    return result.response.productId;
  }

  const getLink = resolveLink(result.response?._links, "get-create-sellable-product");
  if (!getLink) {
    throw new Error("Missing product id after create");
  }

  const workflow = await catalogService.getCreateSellableProduct(getLink);
  if (!workflow.productId) {
    throw new Error("Missing product id after create");
  }

  return workflow.productId;
}
