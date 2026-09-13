
import { useCallback, useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useVariationMatrixMutation } from "@/features/products/hooks/use-variation-matrix";
import { useCatalogLink } from "@/features/products/hooks/use-root";
import type { ProductFormValue, Variant, VariationMatrixRequest, VariationMatrixResponse, VariationType } from "@/features/products/types";

export function useMatrixSync() {
    const { getValues, setValue, control } = useFormContext<ProductFormValue>();
    const generateMatrix = useVariationMatrixMutation(useCatalogLink("generateVariationMatrix"));
    const initTypes = getValues("variationTypes");
    const isInitializedRef = useRef(false);
    const variationTypes = useWatch({
        control,
        name: "variationTypes",
        defaultValue: initTypes
    });
    const lastFingerprintRef = useRef<string>('');

    const regenerate = useCallback(async (types: VariationType[]) => {
        const variants = getValues("product.variants");
        const request = buildMatrixRequest(types, variants);

        const hasValidOptions = request.variantTypes.some((t) => t.options.length > 0);
        if (!hasValidOptions) {
            setValue("product.variants", [], { shouldDirty: true });
            return;
        }

        try {
            const res = await generateMatrix.mutateAsync(request);
            const next = responseToVariant(res, variants, types);
            setValue("product.variants", next, { shouldDirty: true });
        } catch {

        }
    }, [generateMatrix, getValues, setValue]);

    useEffect(() => {
        if (!variationTypes) return;
        const fingerprint = buildStructuralFingerprint(variationTypes);

        if (!isInitializedRef.current) {
            lastFingerprintRef.current = fingerprint;
            isInitializedRef.current = true;
            return;
        }

        if (fingerprint !== lastFingerprintRef.current) {
            lastFingerprintRef.current = fingerprint;
            regenerate(variationTypes);
        }
    }, [variationTypes]);

    return { isGenerating: generateMatrix.isPending };
}

function buildMatrixRequest(
    types: VariationType[],
    existing: Variant[] | null,
): VariationMatrixRequest {
    return {
        variantTypes: types
            .filter((type) => !!type?.uuid)
            .map((type) => ({
                typeId: type.uuid,
                options: (type.options ?? [])
                    .filter((option) => !!option?.uuid)
                    .map((option) => ({
                        optionId: option.uuid,
                    })),
            }))
            .filter((type) => type.options.length > 0),
        variants: existing == null
            ? []
            : existing.filter(Boolean).map((v) => ({
                matrixKey: v.matrixKey,
                variations: (v.variations ?? []).map((vv) => ({
                    optionId: vv.optionId,
                    typeId: vv.typeId,
                })),
            })),
    };
}

function responseToVariant(
    response: VariationMatrixResponse,
    existingVariants: Variant[],
    variationTypes: VariationType[]
): Variant[] {
    const oldData: Record<string, any> = {};

    if (existingVariants && existingVariants.length > 0) {
        existingVariants.forEach((variant) => {
            if (variant) oldData[variant.matrixKey] = { ...variant };
        });
    }

    const nameMap = Object.fromEntries(variationTypes.flatMap((t) =>
        (t?.options ?? []).map((o) => [o?.uuid, o?.name])));

    return response.variants.map((v) => {
        const previous = oldData[v.matrixKey] || {};
        const name = v.variations.map((v) =>
            nameMap[v.optionId] ?? "")
            .filter(Boolean).join(" / ") || "";

        return {
            ...previous,
            name: name,
            matrixKey: v.matrixKey,
            sku: previous?.sku ?? "",
            id: previous?.id,
            variantId: previous?.id ?? previous?.variantId,
            price: previous?.price ?? "0.00",
            manageInventory: previous?.manageInventory === true,
            variations: v.variations.map((vv) => ({
                optionId: vv.optionId,
                typeId: vv.typeId,
            })),
        };
    });
}

function buildStructuralFingerprint(types: VariationType[]): string {
    return types
        .filter((t) => !!t?.uuid)
        .map((t) => {
            const optionIds = (t.options ?? [])
                .filter((o) => !!o?.uuid)
                .map((o) => o.uuid)
                .sort()
                .join(",");
            return `${t.uuid}:[${optionIds}]`;
        })
        .sort()
        .join("|");
}