"use client";

import Link from "next/link";
import { ArrowRight, Building2, Database, FileSpreadsheet, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeScreen() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Logo */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)] text-white shadow-lg">
          <Building2 className="h-9 w-9" />
        </div>

        {/* Heading */}
        <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Welcome to{" "}
          <span className="text-[var(--accent)]">One Sheet Profile</span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-[var(--muted)]">
          A workforce visibility platform for organizational drilldowns,
          employee intelligence, and analytics. Import your datasets to get
          started.
        </p>

        {/* Feature hints */}
        <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
          <FeatureHint
            icon={Database}
            label="Employee Data"
            description="Upload your workforce master"
          />
          <FeatureHint
            icon={GraduationCap}
            label="Training Records"
            description="Track development history"
          />
          <FeatureHint
            icon={FileSpreadsheet}
            label="Work History"
            description="Map career movements"
          />
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Button asChild size="lg" className="gap-2 px-8 text-base">
            <Link href="/import">
              Start Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-5 text-sm text-[var(--muted)]">
          You&apos;ll be guided through a step-by-step import process.
        </p>
      </div>
    </div>
  );
}

function FeatureHint({
  icon: Icon,
  label,
  description,
}: {
  icon: typeof Database;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-4 text-left backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent-strong)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
