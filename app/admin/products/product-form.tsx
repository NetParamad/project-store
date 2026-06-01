'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
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
  const slugEdited = useRef(false)
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? [])

  const [form, setForm] = useState(() => initialData
    ? {
        category_id: initialData.category_id?.toString() ?? 'none',
        name_th: initialData.name_th,
        name_en: initialData.name_en,
        slug: initialData.slug,
        description_th: initialData.description_th ?? '',
        description_en: initialData.description_en ?? '',
        price: initialData.price.toString(),
        stock_qty: initialData.stock_qty.toString(),
        is_active: initialData.is_active,
        is_bookable: initialData.is_bookable,
      }
    : {
        category_id: 'none',
        name_th: '',
        name_en: '',
        slug: '',
        description_th: '',
        description_en: '',
        price: '',
        stock_qty: '0',
        is_active: true,
        is_bookable: false,
      })

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleNameEnChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name_en: value,
      slug: slugEdited.current ? prev.slug : generateSlug(value),
    }))
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

      toast.success('อัปโหลดรูปภาพสำเร็จ!')
    } catch (err) {
      console.error(err)
      toast.error('อัปโหลดรูปภาพล้มเหลว')
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
      toast.success('ลบรูปภาพแล้ว')
    } catch (err) {
      console.error(err)
      toast.error('ลบรูปภาพล้มเหลว')
    }
  }

  async function handleSetPrimary(imageId: number) {
    if (!isEditing || !initialData) {
      setImages(
        images
          .map((img) => ({ ...img, is_primary: img.id === imageId }))
          .sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
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
        images
          .map((img) => ({ ...img, is_primary: img.id === imageId }))
          .sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
      )
      toast.success('อัปเดตรูปหลักแล้ว')
    } catch (err) {
      console.error(err)
      toast.error('อัปเดตรูปหลักล้มเหลว')
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
        stock_qty: parseInt(form.stock_qty) || 0,
        is_active: form.is_active,
        is_bookable: form.is_bookable,
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

        toast.success('อัปเดตสินค้าแล้ว!')
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

        toast.success('สร้างสินค้าแล้ว!')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">หมวดหมู่</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_th">ชื่อ (ภาษาไทย) * <span className="text-destructive"></span></Label>
              <Input
                id="name_th"
                value={form.name_th}
                onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                placeholder="ชื่อสินค้า"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">ชื่อ (ภาษาอังกฤษ) * <span className="text-destructive"></span></Label>
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
            <Label htmlFor="slug">Slug * <span className="text-destructive"></span></Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                const val = e.target.value
                slugEdited.current = val !== ''
                setForm((prev) => ({ ...prev, slug: val }))
              }}
              placeholder="product-slug"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_th">คำอธิบาย (ภาษาไทย)</Label>
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
              <Label htmlFor="description_en">คำอธิบาย (ภาษาอังกฤษ)</Label>
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
          <CardTitle>ราคา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="price">ราคาซื้อ (฿) * <span className="text-destructive"></span></Label>
             <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
             />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สต็อกสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="stock_qty">สต็อก (ขาย) * <span className="text-destructive"></span></Label>
            <Input
              id="stock_qty"
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
              required
            />
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
              สินค้าพร้อมขาย (แสดงต่อลูกค้า)
            </Label>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id="is_bookable"
              checked={form.is_bookable}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_bookable: checked === true })
              }
            />
            <Label htmlFor="is_bookable" className="cursor-pointer">
              เปิดให้จองนัดหมาย
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รูปภาพ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
            >
              <Upload size={16} />
              อัปโหลดรูป
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
              <span className="text-sm text-muted-foreground">กำลังอัปโหลด...</span>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-md border bg-muted overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPrimary(img.id)}
                      className={`h-8 w-8 rounded-full ${
                        img.is_primary
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white'
                          : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-muted-foreground'
                      }`}
                      title="ตั้งเป็นรูปหลัก"
                    >
                      <Star size={14} fill={img.is_primary ? 'currentColor' : 'none'} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(img.id)}
                      className="h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                      title="ลบรูป"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      รูปหลัก
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center gap-3 pb-8">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading
            ? 'กำลังบันทึก...'
            : isEditing
              ? 'อัปเดตสินค้า'
              : 'สร้างสินค้า'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="w-full sm:w-auto"
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  )
}
