'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, CategoryFormData } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  categories: Category[]
  initialData?: Category
}

export function CategoryForm({ categories, initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CategoryFormData>({
    name_th: '',
    name_en: '',
    slug: '',
    description_th: '',
    description_en: '',
    parent_id: 'none',
    sort_order: '0',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        name_th: initialData.name_th,
        name_en: initialData.name_en,
        slug: initialData.slug,
        description_th: initialData.description_th ?? '',
        description_en: initialData.description_en ?? '',
        parent_id: initialData.parent_id?.toString() ?? 'none',
        sort_order: initialData.sort_order.toString(),
      })
    }
  }, [initialData])

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleNameEnChange(value: string) {
    if (!isEditing && !form.slug) {
      setForm({ ...form, name_en: value, slug: generateSlug(value) })
    } else {
      setForm({ ...form, name_en: value })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const payload = {
        name_th: form.name_th,
        name_en: form.name_en,
        slug: form.slug,
        description_th: form.description_th || null,
        description_en: form.description_en || null,
        parent_id: form.parent_id && form.parent_id !== 'none' ? parseInt(form.parent_id) : null,
        sort_order: parseInt(form.sort_order) || 0,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)

        if (error) throw error
        toast.success('Category updated!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload)

        if (error) throw error
        toast.success('Category created!')
      }

      router.push('/admin/categories')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-md border bg-background p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name_th">Name (Thai) *</Label>
            <Input
              id="name_th"
              value={form.name_th}
              onChange={(e) => setForm({ ...form, name_th: e.target.value })}
              placeholder="ชื่อหมวดหมู่"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_en">Name (English) *</Label>
            <Input
              id="name_en"
              value={form.name_en}
              onChange={(e) => handleNameEnChange(e.target.value)}
              placeholder="Category name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="category-slug"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description_th">Description (Thai)</Label>
            <Textarea
              id="description_th"
              value={form.description_th}
              onChange={(e) => setForm({ ...form, description_th: e.target.value })}
              placeholder="คำอธิบายหมวดหมู่"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description_en">Description (English)</Label>
            <Textarea
              id="description_en"
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              placeholder="Category description"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Category</Label>
            <Select
              value={form.parent_id}
              onValueChange={(v) => setForm({ ...form, parent_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (top level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {categories
                  .filter((c) => c.id !== initialData?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name_en}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/categories')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
