'use client'

import Link from 'next/link'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/components/cart-provider'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold">ตะกร้าสินค้า</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ShoppingBag size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">ดูเหมือนคุณยังไม่ได้เพิ่มสินค้าใด ๆ</p>
          <Button asChild>
            <Link href="/products">เลือกซื้อต่อ</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {totalItems} {totalItems !== 1 ? 'ชิ้น' : 'ชิ้น'}
            </p>
            <Button variant="outline" size="sm" onClick={clearCart}>
              ล้างตะกร้า
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                  {(item.product.images?.find(i => i.is_primary) ?? item.product.images?.[0]) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(item.product.images?.find(i => i.is_primary) ?? item.product.images?.[0])!.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      ไม่มีรูป
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-medium text-sm hover:underline line-clamp-1"
                  >
                    {item.product.name_th}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="rounded uppercase">
                      BUY
                    </Badge>
                    <span className="text-sm font-semibold">
                      ฿{item.product.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                <div className="text-right min-w-[80px] self-end sm:self-auto">
                  <p className="font-semibold">
                    ฿{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive shrink-0 self-end sm:self-auto"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardContent></Card>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">รวม</p>
            <p className="text-2xl font-bold">
              ฿{totalPrice.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/products">
                <ArrowLeft size={16} className="mr-2" />
                เลือกซื้อต่อ
              </Link>
            </Button>
            <Button className="w-full sm:flex-1" size="lg" asChild>
              <Link href="/checkout">ดำเนินการสั่งซื้อ</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
