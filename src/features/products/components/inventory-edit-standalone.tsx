import {
    type InventoryEditContext,
} from "@khinemyaezin/seller-contracts";
import { STANDALONE_INVENTORY_EDIT_GROUP_ID } from "../constants/inventory-group-id";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "../types";
import { ManageInventoryField, tracksInventory } from "./manage-inventory-field";
import { InventoryLineEditFullSlot } from "./inventory-edit-full-slot";

export function InventoryEditStandalone() {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => value.length == 0,
    });
    const sku = useWatch({
        control,
        name: "product.standaloneVariant.sku",
        defaultValue: "",
    });
    const variantId = useWatch({
        control,
        name: "product.standaloneVariant.id",
        defaultValue: "",
    });
    const manageInventory = useWatch({
        control,
        name: "product.standaloneVariant.manageInventory",
        defaultValue: true,
    });

    const context: InventoryEditContext = {
        sku: sku ?? "",
        variantId: variantId ?? "",
    };

    if (!isStandalone) return;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                    Set stock by location. Confirm a stock operation, then save the product.
                </CardDescription>
                <CardAction>
                    <ManageInventoryField name="product.standaloneVariant.manageInventory" />
                </CardAction>
            </CardHeader>

            {tracksInventory(manageInventory) && (
                <CardContent>
                    <InventoryLineEditFullSlot
                        groupId={STANDALONE_INVENTORY_EDIT_GROUP_ID}
                        context={context}
                    />
                </CardContent>
            )}
        </Card>
    );
}
