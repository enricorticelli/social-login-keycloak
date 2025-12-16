"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "../lib/i18n";
import { providerLabel, type SocialToken, type TokenPayload } from "../lib/types";

type FlowShellProps = {
  title: string;
  lead: string;
  socialToken?: SocialToken | null;
  keycloakTokens?: TokenPayload | null;
  actionsOk?: boolean;
  children: ReactNode;
};

const steps = [
  { href: "/social", labelKey: "nav.social.label", captionKey: "nav.social.caption", statusKey: "nav.social.status", captionAuthedKey: "nav.social.captionAuthed" },
  { href: "/exchange", labelKey: "nav.exchange.label", captionKey: "nav.exchange.caption", statusKey: "nav.exchange.status", captionAuthedKey: "nav.exchange.captionAuthed" },
  { href: "/actions", labelKey: "nav.actions.label", captionKey: "nav.actions.caption", statusKey: "nav.actions.status" }
];

export function FlowShell({ title, lead, children, socialToken, keycloakTokens, actionsOk }: FlowShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <main>
      <div className="page-shell">
        <header className="top-bar">
          <Link href="/" className="brand">
            <span className="brand-badge">K</span>
            {t("brand.title")}
          </Link>
          <nav className="nav-steps">
            {steps.map(step => {
              const isActive = pathname === step.href;
              return (
                <Link key={step.href} href={step.href} className={`step-link ${isActive ? "active" : ""}`}>
                  <span className="step-eyebrow">{t(step.captionKey)}</span>
                  <span className="step-title">
                    {t(step.labelKey)}
                    {step.href === "/social" && socialToken && <span className="pill success">{t(step.statusKey)}</span>}
                    {step.href === "/exchange" && keycloakTokens?.accessToken && <span className="pill success">{t(step.statusKey)}</span>}
                    {step.href === "/actions" && actionsOk && <span className="pill success">{t(step.statusKey)}</span>}
                  </span>
                  <span className="step-caption">
                    {step.href === "/social" && socialToken
                      ? t(step.captionAuthedKey!, { provider: providerLabel[socialToken.provider] })
                      : step.href === "/exchange" && keycloakTokens?.accessToken
                        ? t(step.captionAuthedKey!)
                        : t(step.captionKey)}
                  </span>
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="panel">
          <div className="section-title">
            <div>
              <p className="step-eyebrow">{t("shell.stepLive")}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <p>{lead}</p>
          <div className="stack">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
