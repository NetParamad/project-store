import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { getTranslations } from 'next-intl/server'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteCategoryButton } from './delete-category-button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const categories = await getCategories(supabase)
  const t = await getTranslations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.categories.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.categories.subtitle')}
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus size={16} className="mr-2" />
            {t('admin.categories.addCategory')}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 700 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">{t('admin.categories.columns.id')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.categories.columns.nameTH')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.categories.columns.nameEN')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.categories.columns.slug')}</TableHead>
              <TableHead className="px-4 py-3 font-medium">{t('admin.categories.columns.order')}</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">{t('admin.categories.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('admin.categories.empty')}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3 font-mono text-xs">{category.id}</TableCell>
                  <TableCell className="px-4 py-3">{category.name_th}</TableCell>
                  <TableCell className="px-4 py-3">{category.name_en}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell className="px-4 py-3">{category.sort_order}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
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
        </CardContent>
      </Card>
    </div>
  )
}
