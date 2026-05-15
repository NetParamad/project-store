import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ImageIcon } from 'lucide-react'
import type { Product, ProductImage } from '@/lib/db.types'
import { Badge } from '@/components/ui/badge'

interface Props {
  product: Product & { images?: ProductImage[] }
}

export async function ProductCard({ product }: Props) {
  const t = await getTranslations('products')
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const hasRental = Number(product.rental_price_daily) > 0 && Number(product.rental_stock_qty) > 0
  const hasPurchase = Number(product.price) > 0 && Number(product.stock_qty) > 0

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-lg border bg-background overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.url}
            alt={product.name_en}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageIcon size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {hasPurchase && <Badge variant="secondary" className="text-xs">{t('buy')}</Badge>}
          {hasRental && <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{t('rent')}</Badge>}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-1">{product.name_en}</h3>
        {product.name_th && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.name_th}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          {hasPurchase && (
            <span className="font-semibold text-sm">
              ฿{Number(product.price).toLocaleString()}
            </span>
          )}
          {hasRental && (
            <span className="text-xs text-muted-foreground">
              ฿{Number(product.rental_price_daily)}{t('perDay')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
