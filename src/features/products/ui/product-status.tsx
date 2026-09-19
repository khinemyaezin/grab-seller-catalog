import { Card, CardContent, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@khinemyaezin/seller-ui/components/select";
import { useFormContext } from "react-hook-form";
import type { ProductFormValue, ProductStatus as ProductStatusValue } from "@/features/products/types";

const SELECTABLE_STATUSES: ProductStatusValue[] = ["DRAFT", "ACTIVE"];

export function formatProductStatus(status: string): string {
    return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getProductStatusDescription(status: string): string {
    switch (status) {
        case "DRAFT":
            return "Not visible on selected sales channels or markets";
        case "ACTIVE":
            return "Sell via selected sales channels and markets";
        case "ARCHIVED":
            return "This product is archived and hidden from customers.";
        case "SUSPENDED":
            return "This product is suspended and hidden from customers.";
        default:
            return "Review this product's current publishing status.";
    }
}

export function getProductStatusBadgeClass(status: string): "success" | "warning" | "destructive" | "default" {
    switch (status) {
        case "ACTIVE":
            return "success";
        case "DRAFT":
            return "warning";
        case "ARCHIVED":
        case "SUSPENDED":
            return "destructive";
        default:
            return "default";
    }
}

function isLockedStatus(status: string): status is "ARCHIVED" | "SUSPENDED" {
    return status === "ARCHIVED" || status === "SUSPENDED";
}

export function ProductStatus() {
    const { setValue, watch } = useFormContext<ProductFormValue>();
    const status = (watch("product.status") ?? "DRAFT").toUpperCase() as ProductStatusValue;
    const locked = isLockedStatus(status);
    const cannotDraft = status === "ACTIVE";
    const options: ProductStatusValue[] = locked
        ? [status]
        : SELECTABLE_STATUSES;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Select
                    value={status}
                    disabled={locked}
                    onValueChange={(next) =>
                        setValue("product.status", next as ProductStatusValue, { shouldDirty: true })
                    }
                >
                    <SelectTrigger className="w-full" aria-label="Status">
                        {formatProductStatus(status)}
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                        {options.map((value) => (
                            <SelectItem
                                key={value}
                                value={value}
                                disabled={value === "DRAFT" && cannotDraft}
                            >
                                <span className="flex flex-col gap-0.5 text-left p-1">
                                    <span className="font-medium">{formatProductStatus(value)}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {getProductStatusDescription(value)}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
}
