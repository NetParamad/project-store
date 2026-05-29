import Link from "next/link";
import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getStoreSettings } from "@/lib/supabase/queries";
import { useField } from "@/lib/i18n";
import { AuthButton } from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { CartButton } from "./cart-button";
import { NotificationBell } from "./notification-bell";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

function AuthSection() {
  return <AuthButton />;
}

function AuthSectionSkeleton() {
  return <div className="h-8 w-24 bg-muted animate-pulse rounded" />;
}

export async function Header() {
  const supabase = await createClient();
  const [t, locale, settings] = await Promise.all([
    getTranslations("nav"),
    getLocale(),
    getStoreSettings(supabase),
  ]);
  const storeName = settings
    ? useField(locale, settings.store_name_th, settings.store_name_en)
    : t("myStore");
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              href="/"
              className="text-xl font-bold hover:text-primary transition-colors truncate shrink-0 max-w-[160px] sm:max-w-none"
            >
              {storeName}
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <NavLinks labels={{ home: t("home"), products: t("products"), about: t("about"), contact: t("contact") }} />
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
            <CartButton />
            <LocaleSwitcher />
            <ThemeSwitcher />
            <Suspense fallback={<AuthSectionSkeleton />}>
              <AuthSection />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
