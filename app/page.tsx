import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthGateway } from "@/features/identity/infra/supabase-auth-gateway";

export default async function Home() {
  const supabase = await createClient();
  const gateway = new SupabaseAuthGateway(supabase);
  const claims = await gateway.getClaims();

  if (claims.userRole === "team_lead") {
    redirect("/queue");
  }
  if (claims.userRole === "specialist") {
    redirect("/feedback");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="bg-reading-surface rounded-box max-w-xl border border-base-300 p-8 text-center">
        <h1 className="text-2xl font-semibold text-primary">Reply Review</h1>
        <p className="font-serif text-reply mt-4">
          Pick a user to continue — use the switcher in the top-right corner.
          There is no separate login form; the switcher is the only way in.
        </p>
      </div>
    </div>
  );
}
