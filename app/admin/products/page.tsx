import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/supabase/queries'
import { Plus, Pencil, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteProductButton } from './delete-product-button'

export default async function ProductsPage() {
  const supabase = await createClient()
  const products = await getProducts(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No products yet. Create your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">
                    {product.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PackageIcon />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name_en}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.name_th}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      ฿{Number(product.price).toLocaleString()}
                    </p>
                    {Number(product.rental_price_daily) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Rent: ฿{Number(product.rental_price_daily)}/day
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      Buy: {product.stock_qty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rent: {product.rental_stock_qty}
                    </p>
                  </TableCell>
                  <TableCell>
                    {product.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff size={12} className="mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={15} />
                        </Button>
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function PackageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="M7.5 9.5 9.5 11" />
    </svg>
  )
}
