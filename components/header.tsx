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
import {
  House,
  Package,
  Store,
  Mail,
  ShoppingBag,
  CalendarDays,
  LayoutDashboard,
} from "lucide-react";

function NavLinks({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"nav">>>;
}) {
  const navLinks = [
    { href: "/", label: t("home"), icon: House },
    { href: "/products", label: t("products"), icon: Package },
    { href: "/about", label: t("about"), icon: Store },
    { href: "/contact", label: t("contact"), icon: Mail },
  ];

  return navLinks.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <link.icon size={16} />
      {link.label}
    </Link>
  ));
}

async function AuthLinks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const t = await getTranslations("nav");

  return (
    <>
      <Link
        href="/orders"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ShoppingBag size={16} />
        {t("orders")}
      </Link>
      <Link
        href="/rentals"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <CalendarDays size={16} />
        {t("rentals")}
      </Link>
    </>
  );
}

async function AdminLink() {
  const supabase = await createClient();
  const profile = await getProfile(supabase);
  if (profile?.role !== "admin") return null;
  const t = await getTranslations("nav");

  return (
    <Link
      href="/admin"
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <LayoutDashboard size={16} />
      {t("admin")}
    </Link>
  );
}

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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold hover:text-primary transition-colors"
            >
              {storeName}
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <NavLinks t={t} />
              <Suspense fallback={null}>
                <AuthLinks />
              </Suspense>
              <Suspense fallback={null}>
                <AdminLink />
              </Suspense>
            </nav>
          </div>

          <div className="flex items-center gap-2">
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
