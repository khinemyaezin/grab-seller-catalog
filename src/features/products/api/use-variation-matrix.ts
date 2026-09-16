
import { catalogService } from ".";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import type { VariationMatrixRequest, VariationMatrixResponse } from "@/features/products/types";
import { useMutation } from "@tanstack/react-query";

export function useVariationMatrixMutation(variationMatrixLink: HateoasLink | undefined) {
  return useMutation<VariationMatrixResponse, Error, VariationMatrixRequest>({
    mutationFn: (request) =>
      catalogService.createVariationMatrix(variationMatrixLink!, request),
  });
}
