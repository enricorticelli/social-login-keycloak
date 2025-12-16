import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { LanguageProvider } from "./lib/i18n";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Keycloak Social Login Demo",
  description: "Demo that shows how to exchange social tokens with Keycloak via APIs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="lang-floating">
            <LanguageSwitcher />
          </div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
