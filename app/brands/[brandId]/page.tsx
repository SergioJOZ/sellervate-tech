import { createClient } from "@/lib/supabase/server";
import { SupabaseBrandTrendRepository } from "@/features/brand-trend/infra/supabase-brand-trend-repository";
import { getBrandTrendPage } from "@/features/brand-trend/application/get-brand-trend-page";
import { TrendChart } from "@/features/brand-trend/ui/TrendChart";
import { TagComparison } from "@/features/brand-trend/ui/TagComparison";
import { SpecialistTable } from "@/features/brand-trend/ui/SpecialistTable";
import { ActionForm } from "@/features/brand-trend/ui/ActionForm";
import { ActionImpactList } from "@/features/brand-trend/ui/ActionImpactList";
import { SummaryTiles } from "@/features/brand-trend/ui/SummaryTiles";
import { EmptyState } from "@/components/ui/EmptyState";
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
          description="This brand does not exist, or you are not a team lead for it."
        />
      </div>
    );
  }

  const {
    brand,
    summary,
    weeklyScores,
    actions,
    tagCounts,
    specialistStats,
    tagOptions,
  } = result.data;

  const boundAction = recordBrandActionForBrand.bind(null, brandId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-primary">{brand.name}</h1>
        <SummaryTiles summary={summary} />
      </header>

      <section aria-labelledby="trend-heading" className="flex flex-col gap-3">
        <h2 id="trend-heading" className="text-lg font-semibold">
          Weekly average score
        </h2>
        {weeklyScores.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Once replies for this brand are reviewed, the weekly trend appears here."
          />
        ) : (
          <TrendChart weeklyScores={weeklyScores} actions={actions} />
        )}
      </section>

      <section
        aria-labelledby="changes-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="changes-heading" className="text-lg font-semibold">
          What we changed
        </h2>
        <ActionImpactList actions={actions} />
        <details className="group">
          <summary className="btn btn-outline btn-sm w-fit">
            Record an action
          </summary>
          <div className="rounded-box mt-3 border border-base-300 bg-base-200 p-4">
            <ActionForm action={boundAction} tagOptions={tagOptions} />
          </div>
        </details>
      </section>

      <section aria-labelledby="tags-heading" className="flex flex-col gap-3">
        <h2 id="tags-heading" className="text-lg font-semibold">
          What we keep getting wrong
        </h2>
        <TagComparison tagCounts={tagCounts} />
      </section>

      <section
        aria-labelledby="specialists-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="specialists-heading" className="text-lg font-semibold">
          By specialist (last 4 weeks)
        </h2>
        <SpecialistTable specialistStats={specialistStats} />
      </section>
    </div>
  );
}
