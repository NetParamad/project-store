import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { ImageIcon } from 'lucide-react'
import type { Product, ProductImage } from '@/lib/db.types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  product: Product & { images?: ProductImage[] }
}

export async function ProductCard({ product }: Props) {
  const [t, locale] = await Promise.all([
    getTranslations('products'),
    getLocale(),
  ])
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const hasPurchase = Number(product.price) > 0 && Number(product.stock_qty) > 0
  const isOutOfStock = Number(product.stock_qty) <= 0
  const displayName = locale === 'th' ? (product.name_th || product.name_en) : (product.name_en || product.name_th)
  const secondaryName = locale === 'th' ? product.name_en : product.name_th

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group rounded-lg border bg-background overflow-hidden hover:shadow-md transition-shadow',
        isOutOfStock && 'opacity-60'
      )}
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
          {isOutOfStock ? (
            <Badge variant="destructive" className="text-xs">{t('outOfStock')}</Badge>
          ) : (
            <>
              {hasPurchase && <Badge variant="secondary" className="text-xs">{t('buy')}</Badge>}
            </>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-1">{displayName}</h3>
        {secondaryName && (
          <p className="text-xs text-muted-foreground line-clamp-1">{secondaryName}</p>
        )}
        {hasPurchase && (
          <span className="font-semibold text-sm pt-1">
            ฿{Number(product.price).toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  )
}
