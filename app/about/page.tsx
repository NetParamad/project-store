import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { useField } from "@/lib/i18n";
import { Store, Shield, Heart } from "lucide-react";

export default async function AboutPage() {
  const supabase = await createClient();
  const [t, locale, settings] = await Promise.all([
    getTranslations("about"),
    getLocale(),
    getStoreSettings(supabase),
  ]);

  const storeName = settings
    ? useField(locale, settings.store_name_th, settings.store_name_en)
    : "My Store";

  const features = [
    {
      icon: Store,
      title: locale === "th" ? "สินค้าคุณภาพ" : "Quality Products",
      desc: locale === "th"
        ? "เราเลือกสรรสินค้าคุณภาพดีมาให้คุณเลือกทั้งซื้อและเช่า"
        : "We curate quality products available for both purchase and rental.",
    },
    {
      icon: Shield,
      title: locale === "th" ? "มั่นใจได้" : "Peace of Mind",
      desc: locale === "th"
        ? "ระบบมัดจำที่โปร่งใส คืนเงินมัดจำเมื่อส่งคืนสินค้าเรียบร้อย"
        : "Transparent deposit system with full refund upon return.",
    },
    {
      icon: Heart,
      title: locale === "th" ? "บริการประทับใจ" : "Great Service",
      desc: locale === "th"
        ? "ทีมงานพร้อมให้คำแนะนำและดูแลคุณตั้งแต่เลือกสินค้าจนถึงส่งมอบ"
        : "Our team is here to help you from selection to delivery.",
    },
  ];

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
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-6 space-y-3">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
