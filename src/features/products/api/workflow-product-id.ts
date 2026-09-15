import { resolveLink } from "@khinemyaezin/seller-api";
import { catalogService } from "@/features/products/api/catalog";
import type { CreateSellableProductResponse } from "@/features/products/types";
import type { AwaitWorkflowResult } from "@/features/products/hooks/use-workflow-awaiter";

export async function resolveWorkflowProductId(
  result: AwaitWorkflowResult<CreateSellableProductResponse>,
): Promise<string> {
  const getLink = resolveLink(result.response?._links, "self");

  if (!getLink) {
    throw new Error("Missing product id after create");
  }

  const workflow = await catalogService.getCreateSellableProduct(getLink);
  if (!workflow.productId) {
    throw new Error("Missing product id after create");
  }

  return workflow.productId;
}
