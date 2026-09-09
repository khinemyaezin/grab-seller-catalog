import { SellerPlatform } from "@khinemyaezin/seller-contracts";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { EntryLinkProvider, PlatformProvider, NotFoundPage, ExtensionRegistry, ExtensionProvider } from "@khinemyaezin/seller-ui";
import { Route, Routes } from "react-router";
import ProductListPage from "@/features/products/pages/product-list-page";
import ProductCreatePage from "@/features/products/pages/product-create-page";
import ProductEditPage from "@/features/products/pages/product-edit-page";
import ProductVariantEditPage from "@/features/products/pages/product-variant-edit-page";
import "../styles.css";

export type AppRoutesProps = {
  link: HateoasLink;
  platform?: SellerPlatform;
  extensions?: ExtensionRegistry;
};

export default function AppRoutes({
  link,
  platform,
  extensions
}: AppRoutesProps) {
  return (
    <div className="seller-product-mfe">
      <ExtensionProvider extensions={extensions}>
        <PlatformProvider platform={platform}>
          <EntryLinkProvider link={link}>
            <Routes>
              <Route index element={<ProductListPage />} />
              <Route path="new" element={<ProductCreatePage/>}/>
              <Route path=":productId" element={<ProductEditPage />} />
              <Route path=":productId/variants/:variantId" element={<ProductVariantEditPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </EntryLinkProvider>
        </PlatformProvider>
      </ExtensionProvider>
    </div>
  );
}
