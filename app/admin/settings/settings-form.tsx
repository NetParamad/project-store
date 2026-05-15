'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StoreSettings, StoreSettingsFormData } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialData: StoreSettings | null
}

export function SettingsForm({ initialData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url ?? null)
  const [qrUrl, setQrUrl] = useState<string | null>(initialData?.promptpay_qr_url ?? null)

  const [form, setForm] = useState<StoreSettingsFormData>({
    store_name_th: '',
    store_name_en: '',
    promptpay_number: '',
    bank_name: '',
    bank_account: '',
    bank_account_name: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        store_name_th: initialData.store_name_th,
        store_name_en: initialData.store_name_en,
        promptpay_number: initialData.promptpay_number ?? '',
        bank_name: initialData.bank_name ?? '',
        bank_account: initialData.bank_account ?? '',
        bank_account_name: initialData.bank_account_name ?? '',
      })
      setLogoUrl(initialData.logo_url)
      setQrUrl(initialData.promptpay_qr_url)
    }
  }, [initialData])

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Upload failed')
      return null
    }

    const { data: urlData } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const url = await uploadFile(file, 'logos')
    if (url) {
      setLogoUrl(url)
      toast.success('Logo uploaded!')
    }
    setUploadingLogo(false)
  }

  async function handleQRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingQR(true)
    const url = await uploadFile(file, 'promptpay')
    if (url) {
      setQrUrl(url)
      toast.success('PromptPay QR uploaded!')
    }
    setUploadingQR(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name_th: form.store_name_th,
          store_name_en: form.store_name_en,
          logo_url: logoUrl,
          promptpay_number: form.promptpay_number || null,
          promptpay_qr_url: qrUrl,
          bank_name: form.bank_name || null,
          bank_account: form.bank_account || null,
          bank_account_name: form.bank_account_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw error
      toast.success('Settings saved!')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store_name_th">Store Name (Thai)</Label>
              <Input
                id="store_name_th"
                value={form.store_name_th}
                onChange={(e) => setForm({ ...form, store_name_th: e.target.value })}
                placeholder="ชื่อร้าน"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_name_en">Store Name (English)</Label>
              <Input
                id="store_name_en"
                value={form.store_name_en}
                onChange={(e) => setForm({ ...form, store_name_en: e.target.value })}
                placeholder="Store name"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Store Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="relative h-16 w-16 rounded-md border bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-500 text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              <Label
                htmlFor="logo-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload size={16} />
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PromptPay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promptpay_number">PromptPay Number</Label>
            <Input
              id="promptpay_number"
              value={form.promptpay_number}
              onChange={(e) => setForm({ ...form, promptpay_number: e.target.value })}
              placeholder="090-xxx-xxxx or xxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label>PromptPay QR Code</Label>
            <div className="flex items-center gap-4">
              {qrUrl && (
                <div className="relative h-24 w-24 rounded-md border bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="PromptPay QR"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setQrUrl(null)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-500 text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              <Label
                htmlFor="qr-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload size={16} />
                {qrUrl ? 'Change QR' : 'Upload QR'}
              </Label>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQRUpload}
                disabled={uploadingQR}
              />
              {uploadingQR && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="e.g., Kasikorn Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">Account Number</Label>
              <Input
                id="bank_account"
                value={form.bank_account}
                onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                placeholder="xxx-x-xxxxx-x"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_name">Account Name</Label>
            <Input
              id="bank_account_name"
              value={form.bank_account_name}
              onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
              placeholder="Account holder name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
