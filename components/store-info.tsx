'use client'

import type { StoreSettings } from '@/lib/db.types'

interface Props {
  settings: StoreSettings
}

export function StoreInfo({ settings }: Props) {
  const hasBank = settings.bank_name && settings.bank_account
  const hasPromptPay = settings.promptpay_number || settings.promptpay_qr_url

  if (!hasBank && !hasPromptPay) return null

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      <h3 className="font-semibold text-sm">Payment Information</h3>

      {hasPromptPay && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">PromptPay</p>
          {settings.promptpay_number && (
            <p className="text-sm">{settings.promptpay_number}</p>
          )}
          {settings.promptpay_qr_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.promptpay_qr_url}
              alt="PromptPay QR"
              className="h-32 w-32 object-contain border rounded-md"
            />
          )}
        </div>
      )}

      {hasBank && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Bank Transfer</p>
          <p className="text-sm font-medium">{settings.bank_name}</p>
          <p className="text-sm">{settings.bank_account}</p>
          {settings.bank_account_name && (
            <p className="text-xs text-muted-foreground">{settings.bank_account_name}</p>
          )}
        </div>
      )}
    </div>
  )
}
