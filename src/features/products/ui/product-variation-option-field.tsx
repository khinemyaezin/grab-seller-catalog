
import type { GetVariationOptionResult, VariationOption, ProductFormValue } from "@/features/products/types";
import { useVariationOptionSearch } from "@/features/products/api/use-option";
import { useCatalogLink } from "@/features/products/api/use-root";
import { useController, UseControllerProps, UseFormGetValues } from "react-hook-form";
import { SearchIcon, Trash } from "lucide-react";
import { useState } from "react";
import { DisplayItem, MagicSearch } from "@khinemyaezin/seller-ui/components/magic-search";
import { Button } from "@khinemyaezin/seller-ui/components/index";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { Field, FieldError } from "@khinemyaezin/seller-ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@khinemyaezin/seller-ui/components/input-group";

interface VariationOptionItemProps {
    index: number;
    typeIndex: number
    getValues: UseFormGetValues<ProductFormValue>
    onRemove: () => void;
    showTrash: boolean;
    onSelectOption: () => void;
    onClearOption?: () => void;
}

export function VariationOptionField({
    typeIndex,
    index,
    onRemove,
    getValues,
    showTrash,
    onSelectOption,
    onClearOption
}: UseControllerProps<ProductFormValue> & VariationOptionItemProps) {
    const link = useCatalogLink("searchVariantOptions");
    const { field, fieldState } = useController({
        name: `variationTypes.${typeIndex}.options.${index}`,
        rules: {
            validate: (value) => {
                const allOptions = getValues(`variationTypes.${typeIndex}.options`) ?? [];
                const isLastOption = index === allOptions.length - 1;

                if (isLastOption && !value?.uuid && allOptions.length > 1) {
                    return true;
                }
                return !!value?.uuid || "Value is required.";
            },
        }
    })

    const type = getValues(`variationTypes.${typeIndex}`);
    const [query, setQuery] = useState<string>(field.value?.name);
    const { data } = useVariationOptionSearch(link, query, type?.uuid ?? "");

    const getFilteredItems = (response: GetVariationOptionResult): DisplayItem[] => {
        const data: VariationOption[] = response.options.map(t => ({
            uuid: t.id,
            name: t.name,
        }));

        const options = getValues(`variationTypes.${typeIndex}.options`) ?? [];
        const existingOptionsIds = new Set(options.map((option) => option?.uuid));

        return (data || [])
            .filter((option) => !existingOptionsIds.has(option.uuid) || option.uuid === field.value?.uuid)
            .map(option => ({ id: option.uuid, name: option.name }));
    };

    return (
        <Field data-invalid={fieldState.invalid}>
            <ButtonGroup>
                <MagicSearch
                    initialQuery={field.value?.name}
                    items={data ? getFilteredItems(data) : []}
                    onQueryChange={setQuery}
                    onQueryClear={() => {
                        field.onChange({ ...field.value, uuid: "", name: "" });
                        onClearOption?.();
                    }}
                    onSelect={(item) => {
                        field.onChange({ ...field.value, uuid: item.id, name: item.name });
                        onSelectOption();
                    }}
                    renderInput={(props) => (
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <SearchIcon className="text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput
                                {...props}
                                id={`variation-option-${index}-input`}
                                placeholder={"Search variation option"}
                                aria-invalid={fieldState.invalid}
                            />
                        </InputGroup>
                    )} />

                {showTrash && (<Button
                    type="button"
                    variant="outline"
                    onClick={onRemove}
                >
                    <Trash />
                </Button>)}
            </ButtonGroup>
            {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
            )}
        </Field>
    );
}
