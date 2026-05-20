import Link from "next/link";
import type { ReactNode } from "react";
import { LegalPageLinks } from "./LegalPageLinks";

type LegalDocumentPageProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function LegalDocumentPage({
  children,
  description,
  title,
}: LegalDocumentPageProps) {
  return (
    <div className="legal-page-scroll">
      <main className="legal-page font-control min-h-full bg-[#111111] text-white">
        <div className="legal-page-inner mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
          <header className="legal-page-header space-y-3 border-b border-white/10 pb-8">
            <Link
              className="legal-page-back text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 transition hover:text-[#CA3E47]"
              href="/"
            >
              ← Back to Playlistly
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-white/55">
              {description}
            </p>
          </header>

          <article className="legal-page-body space-y-8 py-8 text-sm leading-relaxed text-white/75">
            {children}
          </article>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <LegalPageLinks />
            <Link
              className="toolbar-button inline-block px-4 py-2 text-[11px]"
              href="/"
            >
              Open app
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="legal-page-section space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
