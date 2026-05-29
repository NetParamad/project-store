import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts, getCategories } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useField } from "@/lib/i18n";
import { Marquee } from "@/components/marquee";

function RingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9.5" cy="13" r="5.5" />
      <circle cx="14.5" cy="13" r="5.5" />
      <path d="M9.5 7.5L11 3h-3l1.5 4.5" />
      <path d="M14.5 7.5L13 3h3l-1.5 4.5" />
    </svg>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [featured, categories, t, locale] = await Promise.all([
    getFeaturedProducts(supabase),
    getCategories(supabase),
    getTranslations("home"),
    getLocale(),
  ]);

  const features = [1, 2, 3, 4, 5, 6];

  const testimonials = [
    { text: t("testimonial1"), author: t("testimonial1Author") },
    { text: t("testimonial2"), author: t("testimonial2Author") },
    { text: t("testimonial3"), author: t("testimonial3Author") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/[0.03] to-background py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/wedding/1600/900')] bg-cover bg-center opacity-[0.06]" />
        <RingsIcon className="absolute top-8 right-8 w-16 h-16 text-primary/10 rotate-12 hidden sm:block" />
        <RingsIcon className="absolute bottom-8 left-8 w-12 h-12 text-primary/10 -rotate-12 hidden sm:block" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-primary font-medium tracking-[0.25em] uppercase text-sm">
            ✦ {t("heroCta")} ✦
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="min-w-[180px]">
              <Link href="/products">{t("heroCta")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[180px]">
              <Link href="/appointments/book">{t("heroBookCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Marquee>
            {[...features, ...features].map((img, i) => (
              <div key={i} className="shrink-0 w-[320px] sm:w-[400px] overflow-hidden rounded-lg shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/wedding-${img}/600/400`}
                  alt=""
                  className="h-full w-full object-cover aspect-[4/3]"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t("categories")}</h2>
              <Link href="/products" className="text-sm text-primary hover:underline">
                {t("browseAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Card key={cat.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/products?category=${cat.id}`}>
                    <div className="aspect-[3/2] bg-muted overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://picsum.photos/seed/category-${cat.id}/400/300`}
                        alt=""
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 text-center space-y-0.5">
                      <p className="font-medium text-sm">{useField(locale, cat.name_th, cat.name_en)}</p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'th' ? cat.name_en : cat.name_th}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 lg:py-24">
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

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-sm">✦ {t("testimonials")} ✦</p>
          </div>
          <Marquee>
            {[...testimonials, ...testimonials].map((item, idx) => (
              <Card key={idx} className="shrink-0 w-[320px] sm:w-[400px] border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto ring-2 ring-primary/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/seed/wedding-testimonial-${(idx % testimonials.length) + 1}/200/200`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <p className="text-sm font-medium">{item.author}</p>
                </CardContent>
              </Card>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-sm">✦ {t("gallery")} ✦</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/wedding-gallery-${n}/400/400`}
                  alt=""
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
