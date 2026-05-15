'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getProfile, updateProfile } from '@/lib/supabase/queries'
import { Loader2, User, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/lib/db.types'

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/profile')
        return
      }
      const data = await getProfile(supabase)
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name ?? '')
        setPhone(data.phone ?? '')
      }
      setLoading(false)
    }
    fetch()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      const updated = await updateProfile(supabase, {
        display_name: displayName || null,
        phone: phone || null,
      })
      setProfile(updated)
      setMessage(t('profile.saved'))
    } catch {
      setMessage(t('profile.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <User size={28} className="text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('profile.memberSince')}: {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{t('profile.role')}: {profile.role}</p>
        </div>
      </div>

      <Separator />

      {message && (
        <div className={`rounded-lg p-3 text-sm font-medium ${
          message === t('profile.saved')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="displayName">{t('profile.displayName')}</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('profile.displayName')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('profile.phone')}</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="098-XXX-XXXX"
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-1" />
          {saving ? t('common.loading') : t('profile.save')}
        </Button>
      </div>
    </div>
  )
}
