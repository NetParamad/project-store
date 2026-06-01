import { notFound } from 'next/navigation'
import Link from 'next/link'
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
  const product = await getProductBySlug(supabase, slug)

  if (!product) notFound()

  const images = product.images ?? []

  const hasPurchase = Number(product.price) > 0 && Number(product.stock_qty) > 0
  const isOutOfStock = Number(product.stock_qty) <= 0
  const productName = product.name

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        {images.length > 0 ? (
          <ProductGallery images={images} productName={productName} />
        ) : (
          <Card>
            <CardContent className="aspect-square p-0 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
            ไม่มีรูป
          </CardContent></Card>
        )}

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{productName}</h1>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            {hasPurchase && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  ฿{Number(product.price).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">ซื้อ</span>
              </div>
            )}

            {!isOutOfStock && product.is_bookable && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/appointments/book?product=${product.slug}`}>
                  จองลองชุด
                </Link>
              </Button>
            )}
          </div>

          {isOutOfStock ? (
            <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10 text-sm px-3 py-1">
              สินค้าหมด
            </Badge>
          ) : hasPurchase ? (
            <span className="text-sm text-muted-foreground">
              สต็อก: {product.stock_qty}
            </span>
          ) : null}

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="font-medium">รายละเอียด</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.description}
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
