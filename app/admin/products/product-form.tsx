'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product, ProductImage } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2, Star, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  categories: Category[]
  initialData?: Product & { images?: ProductImage[] }
}

export function ProductForm({ categories, initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? [])

  const [form, setForm] = useState({
    category_id: 'none',
    name_th: '',
    name_en: '',
    slug: '',
    description_th: '',
    description_en: '',
    price: '',
    rental_price_daily: '',
    rental_price_weekly: '',
    rental_price_monthly: '',
    deposit: '',
    stock_qty: '0',
    rental_stock_qty: '0',
    is_active: true,
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        category_id: initialData.category_id?.toString() ?? 'none',
        name_th: initialData.name_th,
        name_en: initialData.name_en,
        slug: initialData.slug,
        description_th: initialData.description_th ?? '',
        description_en: initialData.description_en ?? '',
        price: initialData.price.toString(),
        rental_price_daily: initialData.rental_price_daily?.toString() ?? '0',
        rental_price_weekly: initialData.rental_price_weekly?.toString() ?? '0',
        rental_price_monthly: initialData.rental_price_monthly?.toString() ?? '0',
        deposit: initialData.deposit?.toString() ?? '0',
        stock_qty: initialData.stock_qty.toString(),
        rental_stock_qty: initialData.rental_stock_qty.toString(),
        is_active: initialData.is_active,
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (isEditing && initialData) {
        const { data: img, error: imgError } = await supabase
          .from('product_images')
          .insert({
            product_id: initialData.id,
            url: urlData.publicUrl,
            is_primary: images.length === 0,
            sort_order: images.length,
          })
          .select()
          .single()

        if (imgError) throw imgError
        setImages([...images, img])
      } else {
        setImages([
          ...images,
          {
            id: -Date.now(),
            product_id: 0,
            url: urlData.publicUrl,
            is_primary: images.length === 0,
            sort_order: images.length,
            created_at: new Date().toISOString(),
          },
        ])
      }

      toast.success('Image uploaded!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage(imageId: number) {
    try {
      if (imageId > 0) {
        const supabase = createClient()
        await supabase.from('product_images').delete().eq('id', imageId)
      }
      setImages(images.filter((img) => img.id !== imageId))
      toast.success('Image removed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove image')
    }
  }

  async function handleSetPrimary(imageId: number) {
    if (!isEditing || !initialData) {
      setImages(
        images.map((img) => ({ ...img, is_primary: img.id === imageId }))
      )
      return
    }

    try {
      const supabase = createClient()
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', initialData.id)

      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      setImages(
        images.map((img) => ({ ...img, is_primary: img.id === imageId }))
      )
      toast.success('Primary image updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update primary image')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const payload = {
        category_id: form.category_id && form.category_id !== 'none' ? parseInt(form.category_id) : null,
        name_th: form.name_th,
        name_en: form.name_en,
        slug: form.slug,
        description_th: form.description_th || null,
        description_en: form.description_en || null,
        price: parseFloat(form.price) || 0,
        rental_price_daily: parseFloat(form.rental_price_daily) || 0,
        rental_price_weekly: parseFloat(form.rental_price_weekly) || 0,
        rental_price_monthly: parseFloat(form.rental_price_monthly) || 0,
        deposit: parseFloat(form.deposit) || 0,
        stock_qty: parseInt(form.stock_qty) || 0,
        rental_stock_qty: parseInt(form.rental_stock_qty) || 0,
        is_active: form.is_active,
      }

      if (isEditing && initialData) {
        const { error } = await supabase
          .from('products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)

        if (error) throw error

        const existingImages = images.filter((img) => img.id > 0)
        const newImages = images.filter((img) => img.id < 0)

        for (const img of newImages) {
          await supabase.from('product_images').insert({
            product_id: initialData.id,
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })
        }

        if (existingImages.length > 0 && !existingImages.some((i) => i.is_primary)) {
          await supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', existingImages[0].id)
        }

        toast.success('Product updated!')
      } else {
        const { data: product, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        for (const img of images) {
          await supabase.from('product_images').insert({
            product_id: product.id,
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })
        }

        toast.success('Product created!')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_th">Name (Thai) *</Label>
              <Input
                id="name_th"
                value={form.name_th}
                onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                placeholder="ชื่อสินค้า"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                value={form.name_en}
                onChange={(e) => handleNameEnChange(e.target.value)}
                placeholder="Product name"
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
              placeholder="product-slug"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_th">Description (Thai)</Label>
              <Textarea
                id="description_th"
                value={form.description_th}
                onChange={(e) =>
                  setForm({ ...form, description_th: e.target.value })
                }
                placeholder="รายละเอียดสินค้า"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">Description (English)</Label>
              <Textarea
                id="description_en"
                value={form.description_en}
                onChange={(e) =>
                  setForm({ ...form, description_en: e.target.value })
                }
                placeholder="Product description"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Purchase Price (฿)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">
            Rental Pricing
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rental_price_daily">Daily (฿)</Label>
              <Input
                id="rental_price_daily"
                type="number"
                step="0.01"
                min="0"
                value={form.rental_price_daily}
                onChange={(e) =>
                  setForm({ ...form, rental_price_daily: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_price_weekly">Weekly (฿)</Label>
              <Input
                id="rental_price_weekly"
                type="number"
                step="0.01"
                min="0"
                value={form.rental_price_weekly}
                onChange={(e) =>
                  setForm({ ...form, rental_price_weekly: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_price_monthly">Monthly (฿)</Label>
              <Input
                id="rental_price_monthly"
                type="number"
                step="0.01"
                min="0"
                value={form.rental_price_monthly}
                onChange={(e) =>
                  setForm({ ...form, rental_price_monthly: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit (฿)</Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              min="0"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_qty">Stock (Purchase)</Label>
              <Input
                id="stock_qty"
                type="number"
                min="0"
                value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_stock_qty">Stock (Rental)</Label>
              <Input
                id="rental_stock_qty"
                type="number"
                min="0"
                value={form.rental_stock_qty}
                onChange={(e) =>
                  setForm({ ...form, rental_stock_qty: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_active: checked === true })
              }
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Product is active (visible to customers)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
            >
              <Upload size={16} />
              Upload Image
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && (
              <span className="text-sm text-muted-foreground">Uploading...</span>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-md border bg-muted overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      className={`p-1.5 rounded-full ${
                        img.is_primary
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white/80 text-muted-foreground hover:bg-white'
                      }`}
                      title="Set as primary"
                    >
                      <Star size={14} fill={img.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                      title="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={loading}>
          {loading
            ? 'Saving...'
            : isEditing
              ? 'Update Product'
              : 'Create Product'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
