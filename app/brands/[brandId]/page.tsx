import { createClient } from "@/lib/supabase/server";
import { SupabaseBrandTrendRepository } from "@/features/brand-trend/infra/supabase-brand-trend-repository";
import { getBrandTrendPage } from "@/features/brand-trend/application/get-brand-trend-page";
import { TrendChart } from "@/features/brand-trend/ui/TrendChart";
import { TagComparison } from "@/features/brand-trend/ui/TagComparison";
import { SpecialistTable } from "@/features/brand-trend/ui/SpecialistTable";
import { ActionForm } from "@/features/brand-trend/ui/ActionForm";
import { EmptyState } from "@/features/brand-trend/ui/EmptyState";
import { recordBrandActionForBrand } from "./actions";

export default async function BrandTrendPage({
  params,
}: PageProps<"/brands/[brandId]">) {
  const { brandId } = await params;

  const supabase = await createClient();
  const repo = new SupabaseBrandTrendRepository(supabase);
  const result = await getBrandTrendPage(repo, brandId);

  if (!result.ok) {
    return (
      <div className="p-8">
        <EmptyState
          title="Brand not found"
          message="This brand does not exist, or you are not a team lead for it."
        />
      </div>
    );
  }

  const {
    brand,
    weeklyScores,
    tagCounts,
    specialistStats,
    actions,
    tagOptions,
  } = result.data;

  const boundAction = recordBrandActionForBrand.bind(null, brandId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-primary">{brand.name}</h1>
      </header>

      <section aria-labelledby="trend-heading" className="flex flex-col gap-3">
        <h2 id="trend-heading" className="text-lg font-semibold">
          Weekly average score
        </h2>
        {weeklyScores.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            message="Once replies for this brand are reviewed, the weekly trend appears here."
          />
        ) : (
          <TrendChart weeklyScores={weeklyScores} actions={actions} />
        )}
      </section>

      <section aria-labelledby="tags-heading" className="flex flex-col gap-3">
        <h2 id="tags-heading" className="text-lg font-semibold">
          Recurring failures
        </h2>
        <TagComparison tagCounts={tagCounts} />
      </section>

      <section
        aria-labelledby="specialists-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="specialists-heading" className="text-lg font-semibold">
          Per-specialist breakdown (last 4 weeks)
        </h2>
        <SpecialistTable specialistStats={specialistStats} />
      </section>

      <section aria-labelledby="action-heading" className="flex flex-col gap-3">
        <h2 id="action-heading" className="text-lg font-semibold">
          Record an action
        </h2>
        <ActionForm action={boundAction} tagOptions={tagOptions} />
      </section>
    </div>
  );
}
