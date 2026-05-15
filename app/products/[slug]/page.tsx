import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getProductBySlug, getStoreSettings } from '@/lib/supabase/queries'
import { useField } from '@/lib/i18n'
import { AddToCartButton } from './add-to-cart-button'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const [locale, product, settings, t] = await Promise.all([
    import('next-intl/server').then(m => m.getLocale()),
    getProductBySlug(supabase, slug),
    getStoreSettings(supabase),
    getTranslations('products'),
  ])

  if (!product) notFound()

  const images = product.images ?? []
  const primaryImage = images.find((img) => img.is_primary) ?? images[0]
  const otherImages = images.filter((img) => img.id !== primaryImage?.id)

  const hasPurchase = Number(product.price) > 0 && Number(product.stock_qty) > 0
  const hasRental =
    (Number(product.rental_price_daily) > 0 ||
    Number(product.rental_price_weekly) > 0 ||
    Number(product.rental_price_monthly) > 0) && Number(product.rental_stock_qty) > 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.url}
                alt={product.name_en}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                {t('noImage')}
              </div>
            )}
          </div>
          {otherImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {otherImages.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-md border bg-muted overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name_en}</h1>
            {product.name_th && (
              <p className="text-lg text-muted-foreground mt-1">
                {product.name_th}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            {hasPurchase && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  ฿{Number(product.price).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">{t('purchase')}</span>
              </div>
            )}

            {hasRental && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('rentalPrices')}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {Number(product.rental_price_daily) > 0 && (
                    <div className="bg-background rounded-md p-2">
                      <p className="text-lg font-bold">
                        ฿{Number(product.rental_price_daily)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('perDay')}</p>
                    </div>
                  )}
                  {Number(product.rental_price_weekly) > 0 && (
                    <div className="bg-background rounded-md p-2">
                      <p className="text-lg font-bold">
                        ฿{Number(product.rental_price_weekly)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('perWeek')}</p>
                    </div>
                  )}
                  {Number(product.rental_price_monthly) > 0 && (
                    <div className="bg-background rounded-md p-2">
                      <p className="text-lg font-bold">
                        ฿{Number(product.rental_price_monthly)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('perMonth')}</p>
                    </div>
                  )}
                </div>
                {Number(product.deposit) > 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {t('deposit')}: ฿{Number(product.deposit).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex gap-4 text-sm">
            {hasPurchase && (
              <span className="text-muted-foreground">
                {t('stockBuy')}: {product.stock_qty}
              </span>
            )}
            {hasRental && (
              <span className="text-muted-foreground">
                {t('stockRent')}: {product.rental_stock_qty}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description_en && (
            <div className="space-y-2">
              <h3 className="font-medium">{t('description')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.description_en}
              </p>
            </div>
          )}

          {product.description_th && (
            <div className="space-y-2">
              <h3 className="font-medium">{t('details')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.description_th}
              </p>
            </div>
          )}

          {/* Add to Cart */}
          <AddToCartButton
            product={product}
            hasPurchase={hasPurchase}
            hasRental={hasRental}
          />


        </div>
      </div>
    </div>
  )
}
