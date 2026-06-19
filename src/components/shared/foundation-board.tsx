import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type BoardSection = {
  title: string;
  body: string;
};

export function FoundationBoard({
  summary,
  sections,
}: {
  summary: string;
  sections: BoardSection[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-[30px]">
        <CardHeader>
          <CardTitle>Foundation Summary</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-[24px] border border-[var(--border)] bg-white/72 p-5"
            >
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {section.body}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[30px]">
        <CardHeader>
          <CardTitle>Implementation Intent</CardTitle>
          <CardDescription>
            This route is intentionally scaffolded, not feature-complete.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-[var(--border)] bg-white/72 p-5">
            <p className="text-sm font-semibold">What is ready now</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Typed routes, route shells, parsing contracts, local dataset
              persistence, and the shared analytics-oriented presentation layer.
            </p>
          </div>
          <Separator />
          <div className="flex items-start gap-3 rounded-[24px] bg-[var(--surface)] p-5">
            <ArrowRight className="mt-1 h-4 w-4 text-[var(--accent-strong)]" />
            <p className="text-sm leading-7 text-[var(--foreground)]">
              Business features will plug into this skeleton without needing a
              routing or state architecture rewrite.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
