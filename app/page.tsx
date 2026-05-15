import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts, getCategories, getStoreSettings } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product-card";
import { StoreInfo } from "@/components/store-info";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { useField } from "@/lib/i18n";

export default async function HomePage() {
  const supabase = await createClient();
  const [featured, categories, settings, t, locale] = await Promise.all([
    getFeaturedProducts(supabase),
    getCategories(supabase),
    getStoreSettings(supabase),
    getTranslations("home"),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-primary/5 to-background py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <SearchBar />
            <Button asChild size="lg">
              <Link href="/products">{t("heroCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t("categories")}</h2>
              <Link href="/products" className="text-sm text-primary hover:underline">
                {t("browseAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="rounded-lg border bg-card hover:bg-accent transition-colors p-4 text-center space-y-1"
                >
                  <p className="font-medium">{useField(locale, cat.name_th, cat.name_en)}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'th' ? cat.name_en : cat.name_th}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl font-bold">{t("featured")}</h2>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("noFeatured")}</p>
          )}
          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/products">{t("browseAll")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Store Info */}
      {settings && <StoreInfo settings={settings} />}
    </div>
  );
}
