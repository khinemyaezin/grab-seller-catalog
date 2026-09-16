import { useCallback } from "react";
import { useNavigate } from "react-router";
import { usePlatform } from "@khinemyaezin/seller-ui";
import type { ProductLifecycleEvent } from "@/features/products/types";
import { formatExtensionErrorsForToast } from "@/features/products/lib/error-formatter";

export function useProductCreateEvents() {
  const platform = usePlatform();
  const navigate = useNavigate();

  const toast = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      message: string,
      description?: string,
    ) => {
      platform?.events.emit("shell:toast:v1", {
        type,
        message,
        description,
        position: "top-center",
      });
    },
    [platform?.events],
  );

  const handleEvent = useCallback(
    (event: ProductLifecycleEvent) => {
      switch (event.type) {
        case "created":
          toast("success", "Product created");
          navigate(`../${event.productId}`);
          break;
        case "createMediaFailed":
          toast(
            "warning",
            "Product created, but images could not be saved. Add them from the product page.",
          );
          navigate(`../${event.productId}`);
          break;
        case "createDescriptionFailed":
          toast(
            "warning",
            "Product created, but the description could not be saved. Add it from the product page.",
          );
          navigate(`../${event.productId}`);
          break;
        case "createFailed":
          toast("error", "Failed to create product. Check pricing and inventory.");
          break;
        case "createTimedOut":
          toast("info", "Product creation is still running. Check the product list shortly.");
          break;
        case "validationFailed": {
          const { message, description } = formatExtensionErrorsForToast(
            event.errors,
            event.name ?? "Validation failed",
          );
          toast("error", message, description);
          break;
        }
      }
    },
    [navigate, toast],
  );

  return {
    handleEvent,
    toast,
  };
}
