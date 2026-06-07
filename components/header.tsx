import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { AuthButton } from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { CartButton } from "./cart-button";
import { NotificationBell } from "./notification-bell";
import { NavLinks } from "./nav-links";


function AuthSection() {
  return <AuthButton />;
}

function AuthSectionSkeleton() {
  return <div className="h-8 w-24 bg-muted animate-pulse rounded" />;
}

export async function Header() {
  const supabase = await createClient();
  const settings = await getStoreSettings(supabase);
  const storeName = settings?.store_name || 'ร้านของฉัน';
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors truncate shrink-0 max-w-[160px] sm:max-w-none"
            >
              <span>{storeName}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <NavLinks labels={{ home: "หน้าแรก", products: "สินค้า", about: "เกี่ยวกับ", contact: "ติดต่อ" }} />
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
            <CartButton />
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
