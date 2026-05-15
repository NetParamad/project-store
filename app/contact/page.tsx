import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { useField } from "@/lib/i18n";
import { Mail, Phone, MapPin, Banknote, QrCode, Building2 } from "lucide-react";

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

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 lg:py-28">
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
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t("address")}</p>
                    <p className="text-sm text-muted-foreground">{t("addressLine")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t("email")}</p>
                    <p className="text-sm text-muted-foreground">contact@mystore.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t("phone")}</p>
                    <p className="text-sm text-muted-foreground">+66 12 345 6789</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t("paymentInfo")}</h2>
              <p className="text-sm text-muted-foreground">{t("orContactVia")}</p>
              <div className="space-y-4">
                {settings?.promptpay_number && (
                  <div className="rounded-lg border p-4 space-y-2">
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
                  </div>
                )}
                {settings?.bank_name && settings?.bank_account && (
                  <div className="rounded-lg border p-4 space-y-2">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
