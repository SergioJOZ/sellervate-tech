import type { Metadata } from "next";
import Link from "next/link";
import { Outfit, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthGateway } from "@/features/identity/infra/supabase-auth-gateway";
import {
  SEED_USERS,
  listSwitcherOptions,
} from "@/features/identity/domain/seed-users";
import { UserSwitcher } from "@/features/identity/ui/UserSwitcher";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Reply Review",
  description: "Review specialists' customer-support replies per brand.",
};

interface NavBrand {
  id: string;
  name: string;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const gateway = new SupabaseAuthGateway(supabase);
  const claims = await gateway.getClaims();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserKey =
    SEED_USERS.find((u) => u.email === user?.email)?.key ?? null;

  // Nav only: brand NAMES for the current member brands via a normal
  // RLS-scoped query (design.md — claims are for navigation, never authz).
  let navBrands: NavBrand[] = [];
  if (claims.userRole === "team_lead" && claims.brandIds.length > 0) {
    const { data } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");
    navBrands = data ?? [];
  }

  return (
    <html
      lang="en"
      data-theme="reply-review"
      className={`${outfit.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="navbar bg-base-200 border-b border-base-300 px-4">
          <div className="flex flex-1 items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-primary">
              Reply Review
            </Link>
            {claims.userRole === "team_lead" && (
              <nav aria-label="Main" className="flex items-center gap-1">
                <Link href="/queue" className="btn btn-ghost btn-sm">
                  Review replies
                </Link>
                {navBrands.length > 0 && (
                  // dropdown-hover also opens on focus, so it works with a
                  // keyboard and on touch, not only on mouse hover.
                  <div className="dropdown dropdown-hover">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-sm"
                    >
                      Statistics
                      <span aria-hidden="true">▾</span>
                    </div>
                    <ul
                      tabIndex={0}
                      className="menu dropdown-content bg-base-200 rounded-box z-10 w-52 p-2 shadow-sm"
                    >
                      {navBrands.map((brand) => (
                        <li key={brand.id}>
                          <Link href={`/brands/${brand.id}`}>{brand.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </nav>
            )}
            {claims.userRole === "specialist" && (
              <nav aria-label="Main" className="flex items-center gap-1">
                <Link href="/feedback" className="btn btn-ghost btn-sm">
                  My feedback
                </Link>
              </nav>
            )}
          </div>
          <div className="flex-none">
            <UserSwitcher
              users={listSwitcherOptions()}
              currentUserKey={currentUserKey}
            />
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
