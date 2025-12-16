"use client";

import { useI18n, type Lang } from "../lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <label className="lang-switch">
      <select
        className="lang-select"
        value={lang}
        onChange={event => setLang(event.target.value as Lang)}
      >
        <option value="en">English</option>
        <option value="it">Italiano</option>
      </select>
    </label>
  );
}
