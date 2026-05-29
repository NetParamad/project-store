import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { useField } from "@/lib/i18n";
import { Mail, Phone, MapPin, QrCode, Building2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function ContactPage() {
  const supabase = await createClient();
  const [t, locale, settings] = await Promise.all([
    getTranslations("contact"),
    getLocale(),
    getStoreSettings(supabase),
  ]);

  const storeName = settings
    ? useField(locale, settings.store_name_th, settings.store_name_en)
    : "My Store";

  const address = settings
    ? useField(locale, settings.address_th, settings.address_en)
    : null;

  const socialLinks = ([
    { url: settings?.facebook_url, icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, label: "Facebook" },
    { url: settings?.instagram_url, icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.162 12 18.162s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, label: "Instagram" },
    { url: settings?.line_url, icon: <svg className="h-4 w-4" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="#06C755"/><rect x="4" y="6" width="16" height="12" rx="3" fill="white"/><path d="M8 12h8" stroke="#06C755" strokeWidth="2" strokeLinecap="round" fill="none"/><circle cx="9" cy="9" r="1" fill="#06C755"/><circle cx="15" cy="9" r="1" fill="#06C755"/></svg>, label: "Line" },
    { url: settings?.tiktok_url, icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, label: "TikTok" },
    { url: settings?.youtube_url, icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, label: "YouTube" },
  ] as { url: string | null; icon: React.ReactNode; label: string }[]).filter(s => s.url);

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 sm:py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{storeName}</h2>
              <div className="space-y-4">
                {address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t("address")}</p>
                      <a
                        href={settings?.map_url || `https://maps.google.com/?q=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {address}
                      </a>
                    </div>
                  </div>
                )}
                {settings?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t("email")}</p>
                      <a href={`mailto:${settings.email}`} className="text-sm text-primary hover:underline">
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}
                {settings?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t("phone")}</p>
                      <a href={`tel:${settings.phone}`} className="text-sm text-primary hover:underline">
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {socialLinks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t("followUs")}</h3>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((s) => (
                      <Link
                        key={s.label}
                        href={s.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-accent transition-colors text-sm"
                      >
                        {s.icon}
                        {s.label}
                        <ExternalLink size={12} className="text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("paymentInfo")}</h2>
              <p className="text-sm text-muted-foreground">{t("orContactVia")}</p>
              <div className="space-y-4">
                {settings?.promptpay_number && (
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      <p className="font-medium">PromptPay</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {settings.promptpay_number}
                    </p>
                    {settings.promptpay_qr_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.promptpay_qr_url}
                        alt="PromptPay QR"
                        className="w-40 h-40 object-contain border rounded-lg"
                      />
                    )}
                  </Card>
                )}
                {settings?.bank_name && settings?.bank_account && (
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <p className="font-medium">{t("bankTransfer")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {settings.bank_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("account")}: {settings.bank_account}
                    </p>
                    {settings.bank_account_name && (
                      <p className="text-sm text-muted-foreground">
                        {t("name")}: {settings.bank_account_name}
                      </p>
                    )}
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
