import { notFound } from "next/navigation";
import { getQuoteByToken } from "@/lib/leads";
import { RespondButtons } from "./respond-buttons";
import { ShareBar } from "./share-bar";

export default async function PublicQuotePage(props: PageProps<"/quote/[token]">) {
  const { token } = await props.params;
  const quote = await getQuoteByToken(token);
  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-amber">
              Energy Life Performance
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Solar proposal for {quote.lead.name}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {quote.lead.suburb} · designed from your on-site assessment
            </p>
          </div>
          <ShareBar token={token} clientName={quote.lead.name} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {quote.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col gap-4 rounded-lg border bg-surface p-5 ${
                tier.isRecommended ? "border-amber shadow-sm" : "border-line"
              }`}
            >
              {tier.isRecommended && (
                <span className="w-fit rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber">
                  Recommended
                </span>
              )}
              <div>
                <h2 className="text-lg font-bold text-foreground">{tier.name}</h2>
                {tier.tagline && <p className="mt-1 text-sm text-ink-soft">{tier.tagline}</p>}
              </div>

              <p className="font-mono text-3xl font-bold tabular-nums text-foreground">
                R{tier.price.toLocaleString("en-ZA")}
              </p>

              {tier.backupDescription && (
                <p className="rounded-md bg-teal-soft px-3 py-2 text-sm text-teal">
                  {tier.backupDescription}
                </p>
              )}

              <dl className="flex flex-col gap-2 text-sm">
                <Spec label="Solar panels" value={`${tier.panelKw} kW`} />
                <Spec label="Inverter" value={`${tier.inverterKva} kVA`} />
                <Spec label="Battery storage" value={`${tier.batteryKwh} kWh`} />
                {tier.estMonthlyProductionKwh && (
                  <Spec label="Est. monthly production" value={`${tier.estMonthlyProductionKwh} kWh`} />
                )}
                {tier.warrantyYears && (
                  <Spec label="Warranty" value={`${tier.warrantyYears} years`} />
                )}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-line bg-surface p-6">
          {quote.status === "ACCEPTED" ? (
            <p className="text-sm font-medium text-teal">
              Thanks — you&apos;ve accepted this proposal. Your EP rep will be in touch to arrange the deposit and installation date.
            </p>
          ) : quote.status === "DECLINED" ? (
            <p className="text-sm text-ink-soft">
              You&apos;ve marked this proposal as not right now. Reach out any time if that changes.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-soft">
                Choose the option that fits — or reply to your EP rep with any questions before deciding.
              </p>
              <RespondButtons token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-line pt-2 first:border-none first:pt-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
