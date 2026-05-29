import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/supabase/queries'
import { getTranslations } from 'next-intl/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const settings = await getStoreSettings(supabase)
  const t = await getTranslations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('admin.settings.subtitle')}
        </p>
      </div>
      <SettingsForm initialData={settings} />
    </div>
  )
}
