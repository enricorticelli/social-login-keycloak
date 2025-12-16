"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
  { href: "/social", label: "Social login", caption: "Ottieni il token reale" },
  { href: "/exchange", label: "Keycloak exchange", caption: "Scambia il token" },
  { href: "/actions", label: "API protette", caption: "Leggi profilo / refresh" }
];

export function FlowShell({ title, lead, children, socialToken, keycloakTokens, actionsOk }: FlowShellProps) {
  const pathname = usePathname();

  return (
    <main>
      <div className="page-shell">
        <header className="top-bar">
          <Link href="/" className="brand">
            <span className="brand-badge">K</span>
            Keycloak Social Flow
          </Link>
          <nav className="nav-steps">
            {steps.map(step => {
              const isActive = pathname === step.href;
              return (
                <Link key={step.href} href={step.href} className={`step-link ${isActive ? "active" : ""}`}>
                  <span className="step-eyebrow">{step.caption}</span>
                  <span className="step-title">
                    {step.label}
                    {step.href === "/social" && socialToken && <span className="pill success">OK</span>}
                    {step.href === "/exchange" && keycloakTokens?.accessToken && <span className="pill success">OK</span>}
                    {step.href === "/actions" && actionsOk && <span className="pill success">OK</span>}
                  </span>
                  <span className="step-caption">
                    {step.href === "/social" && socialToken
                      ? `Accesso con ${providerLabel[socialToken.provider]}`
                      : step.href === "/exchange" && keycloakTokens?.accessToken
                        ? "Access token da Keycloak"
                        : step.caption}
                  </span>
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="panel">
          <div className="section-title">
            <div>
              <p className="step-eyebrow">Step live</p>
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
