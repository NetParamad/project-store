import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import type { Product, ProductImage } from '@/lib/db.types'
import { Badge } from '@/components/ui/badge'
import { AvailabilityBadge } from '@/components/availability-badge'

interface Props {
  product: Product & { images?: ProductImage[] }
  available?: boolean
}

export async function ProductCard({ product, available }: Props) {
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const displayName = product.name

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
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageIcon size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {product.product_type === 'book' && (
              <Badge variant="secondary">จอง</Badge>
            )}
            {product.product_type === 'rent' && (
              <Badge variant="secondary">เช่าชุด</Badge>
            )}
            {product.product_type === 'both' && (
              <Badge variant="secondary">จอง+เช่า</Badge>
            )}
          </div>
          {available !== undefined && <AvailabilityBadge available={available} />}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1">{displayName}</h3>
        {(product.product_type === 'rent' || product.product_type === 'both') && Number(product.rental_price) > 0 && (
          <p className="text-xs text-muted-foreground">
            เช่า <span className="font-medium text-foreground">฿{Number(product.rental_price).toLocaleString()}</span>
            {Number(product.rental_deposit) > 0 && (
              <> + ประกัน ฿{Number(product.rental_deposit).toLocaleString()}</>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
