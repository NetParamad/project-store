import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteCategoryButton } from './delete-category-button'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage product categories
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus size={16} className="mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name (TH)</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-16">Order</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No categories yet. Create your first category!
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs">{category.id}</TableCell>
                  <TableCell>{category.name_th}</TableCell>
                  <TableCell>{category.name_en}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={15} />
                        </Button>
                      </Link>
                      <DeleteCategoryButton id={category.id} />
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
