import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/lib/supabase/queries'
import { AddToCartButton } from './add-to-cart-button'
import { ProductGallery } from './product-gallery'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const [locale, product, t] = await Promise.all([
    import('next-intl/server').then(m => m.getLocale()),
    getProductBySlug(supabase, slug),
    getTranslations('products'),
  ])

  if (!product) notFound()

  const images = product.images ?? []

  const hasPurchase = Number(product.price) > 0 && Number(product.stock_qty) > 0
  const isOutOfStock = Number(product.stock_qty) <= 0
  const productName = locale === 'th' ? (product.name_th || product.name_en) : (product.name_en || product.name_th)
  const otherName = locale === 'th' ? product.name_en : product.name_th

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        {images.length > 0 ? (
          <ProductGallery images={images} productName={productName} />
        ) : (
          <Card>
            <CardContent className="aspect-square p-0 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
            {t('noImage')}
          </CardContent></Card>
        )}

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{productName}</h1>
            {otherName && (
              <p className="text-lg text-muted-foreground mt-1">
                {otherName}
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

            {!isOutOfStock && product.is_bookable && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/appointments/book?product=${product.slug}`}>
                  {t('bookAppointment')}
                </Link>
              </Button>
            )}
          </div>

          {isOutOfStock ? (
            <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10 text-sm px-3 py-1">
              {t('outOfStock')}
            </Badge>
          ) : hasPurchase ? (
            <span className="text-sm text-muted-foreground">
              {t('stockBuy')}: {product.stock_qty}
            </span>
          ) : null}

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

          {hasPurchase && (
            <AddToCartButton
              product={product}
              outOfStock={isOutOfStock}
            />
          )}


        </div>
      </div>
    </div>
  )
}
