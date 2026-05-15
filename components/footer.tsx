import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

async function AuthFooterLinks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const t = await getTranslations("nav");

  return (
    <>
      <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("orders")}</Link>
      <Link href="/rentals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("rentals")}</Link>
    </>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();
  const t = await getTranslations("nav");

  return (
    <footer className="border-t bg-background/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {year} Project Store. All rights reserved.
          </p>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("home")}</Link>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("products")}</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("about")}</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("contact")}</Link>
            <AuthFooterLinks />
          </nav>
        </div>
      </div>
    </footer>
  );
}
